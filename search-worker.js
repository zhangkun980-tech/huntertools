self.onmessage = (event) => {
  try {
    const payload = event.data || {};
    const builds = searchBuilds(payload);
    self.postMessage({ type: "done", builds });
  } catch (error) {
    self.postMessage({ type: "error", message: error.message });
  }
};

function searchBuilds(payload) {
  const { candidateParts, weapon, charm, targets, limit, comboCount } = payload;
  const builds = [];
  let done = 0;
  for (const head of candidateParts.head) {
    for (const chest of candidateParts.chest) {
      for (const arms of candidateParts.arms) {
        for (const waist of candidateParts.waist) {
          for (const legs of candidateParts.legs) {
            pushTopBuild(builds, evaluateBuild([weapon, head, chest, arms, waist, legs, charm], payload), limit, payload.sortMode);
            done += 1;
            if (done % 1500 === 0) self.postMessage({ type: "progress", done, total: comboCount });
          }
        }
      }
    }
  }
  self.postMessage({ type: "progress", done, total: comboCount });
  return builds.sort((a, b) => compareBuilds(a, b, payload.sortMode));
}

function pushTopBuild(builds, build, limit, sortMode) {
  if (builds.length < limit) {
    builds.push(build);
    return;
  }
  let worstIndex = 0;
  for (let i = 1; i < builds.length; i += 1) {
    if (compareBuilds(builds[i], builds[worstIndex], sortMode) > 0) worstIndex = i;
  }
  if (compareBuilds(build, builds[worstIndex], sortMode) < 0) builds[worstIndex] = build;
}

function evaluateBuild(parts, payload) {
  const total = {};
  const slots = [];
  let defense = 0;
  parts.forEach((part) => {
    Object.entries(part.skills || {}).forEach(([name, level]) => addSkill(total, name, level));
    const partSlots = toSlotObjects(part, payload.game);
    const manualDecos = manualDecorationsForPart(part, partSlots, payload);
    manualDecos.forEach(({ deco }) => {
      Object.entries(deco.skills || {}).forEach(([name, level]) => addSkill(total, name, level));
    });
    slots.push(...partSlots.filter((slot, index) => !manualDecos.some((entry) => entry.index === index)));
    defense += part.defense || 0;
  });

  const decorations = parts.flatMap((part) => manualDecorationsForPart(part, toSlotObjects(part, payload.game), payload).map(({ deco }) => deco.name));
  const openSlots = [...slots].sort(compareSlots);
  Object.entries(payload.targets)
    .sort((a, b) => decoSize(b[0], payload) - decoSize(a[0], payload))
    .forEach(([name, targetLevel]) => {
      while ((total[name] || 0) < targetLevel) {
        const slotIndex = openSlots.findIndex((slot) => bestDecoForSlot(name, slot, payload));
        if (slotIndex === -1) break;
        const [slot] = openSlots.splice(slotIndex, 1);
        const decoration = bestDecoForSlot(name, slot, payload);
        const gained = Math.min(decoration.level || 1, targetLevel - (total[name] || 0));
        addSkill(total, name, gained);
        decorations.push(decoration.name);
      }
    });

  const missing = Object.entries(payload.targets).filter(([name, targetLevel]) => (total[name] || 0) < targetLevel);
  const achievedLevels = Object.entries(payload.targets).reduce((sum, [name, targetLevel]) => sum + Math.min(total[name] || 0, targetLevel), 0);
  const requiredLevels = Object.values(payload.targets).reduce((sum, targetLevel) => sum + targetLevel, 0);
  const completion = requiredLevels ? Math.round((achievedLevels / requiredLevels) * 100) : 0;
  const targetScore = Object.entries(payload.targets).reduce((sum, [name, targetLevel]) => {
    const current = Math.min(total[name] || 0, targetLevel);
    return sum + current * 18;
  }, 0);
  const openSlotScore = openSlots.reduce((sum, slot) => sum + slot.level, 0);
  const overcapScore = Object.entries(payload.targets).reduce((sum, [name, targetLevel]) => sum + Math.max(0, (total[name] || 0) - targetLevel), 0);
  const score = targetScore + openSlotScore + overcapScore + defense / 120 - missing.length * 28;

  return { parts, total, decorations, missing, openSlots, openSlotScore, score, defense, completion };
}

function decoSize(skillName, payload) {
  return payload.decosBySkill[skillName]?.[0]?.slot || payload.skillMap[skillName]?.deco || 4;
}

function bestDecoForSlot(skillName, slot, payload) {
  const excluded = new Set(payload.excludedDecos || []);
  const decorations = payload.decosBySkill[skillName] || [];
  return decorations.find((deco) => !excluded.has(deco.name) && slot.level >= deco.slot && canUseDecoration(slot, deco, payload.game));
}

function manualDecorationsForPart(part, slots, payload) {
  const selections = payload.manualDecos || {};
  return slots
    .map((slot, index) => {
      const name = selections[`${part.part}:${index}`];
      if (!name) return null;
      const deco = findDecorationByName(name, payload);
      if (!deco || deco.slot > slot.level || !canUseDecoration(slot, deco, payload.game)) return null;
      return { index, deco };
    })
    .filter(Boolean);
}

function findDecorationByName(name, payload) {
  for (const list of Object.values(payload.decosBySkill || {})) {
    const deco = list.find((item) => item.name === name);
    if (deco) return deco;
  }
  return null;
}

function toSlotObjects(part, game) {
  const type = slotTypeForPart(part.part, game);
  return (part.slots || []).map((level) => ({ level, type }));
}

function slotTypeForPart(partName, game) {
  if (game !== "wilds") return "any";
  return partName === "weapon" ? "weapon" : "equip";
}

function canUseDecoration(slot, decoration, game) {
  if (game !== "wilds") return true;
  if (decoration.type === "preserver") return slot.type !== "weapon";
  return slot.type === decoration.type;
}

function compareSlots(a, b) {
  return a.level - b.level || a.type.localeCompare(b.type);
}

function compareBuilds(a, b, mode = "match") {
  if (mode === "defense") return b.defense - a.defense || b.score - a.score;
  if (mode === "slots") return b.openSlotScore - a.openSlotScore || b.score - a.score;
  return b.score - a.score || b.openSlotScore - a.openSlotScore || b.defense - a.defense;
}

function addSkill(target, name, level = 0) {
  if (!name || level <= 0) return;
  target[name] = (target[name] || 0) + level;
}
