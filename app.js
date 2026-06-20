const config = {
  dataUrl: document.body.dataset.dataUrl || "data/mhr-sunbreak.json",
  game: document.body.dataset.game || "sunbreak",
  anchor: document.body.dataset.anchor || "sunbreak-builder",
  defaultWeapon: document.body.dataset.defaultWeapon || "太刀"
};

const SEARCH_SCOPE_LIMITS = {
  smart: 12,
  deep: 24,
  full: Infinity
};
const sunbreakDefaultTargetSkills = ["攻击", "看破", "弱点特效", "超会心", "纳刀术", "达人艺", "体术", "耐力急速回复", "装填扩充", "速射强化", "防御性能", "翔虫使"];
const wildsDefaultTargetSkills = ["攻击", "看破", "弱点特效", "超会心", "挑战者", "连击", "纳刀术", "集中", "强化持续", "体术", "耐力急速回复", "速射强化", "格挡性能", "炮术"];

const sunbreakWeaponPresets = {
  大剑: { 攻击: 4, 看破: 4, 弱点特效: 3, 超会心: 3, 集中: 3 },
  太刀: { 攻击: 4, 弱点特效: 3, 超会心: 3, 纳刀术: 3, 翔虫使: 3 },
  单手剑: { 攻击: 4, 看破: 5, 弱点特效: 3, 超会心: 3, 达人艺: 3 },
  双剑: { 攻击: 4, 看破: 5, 弱点特效: 3, 体术: 3, 耐力急速回复: 2 },
  长枪: { 攻击: 4, 弱点特效: 3, 超会心: 3, 防御性能: 3, 防御强化: 1 },
  铳枪: { 攻击: 4, 炮术: 3, 防御性能: 3, 炮弹装填: 2, 翔虫使: 3 },
  大锤: { 攻击: 4, 看破: 4, 弱点特效: 3, 超会心: 3, 击晕术: 2 },
  狩猎笛: { 攻击: 4, 看破: 4, 弱点特效: 3, 超会心: 3, 吹笛名人: 1 },
  斩斧: { 攻击: 4, 弱点特效: 3, 超会心: 3, 高速变形: 3, 强化持续: 2 },
  盾斧: { 攻击: 4, 弱点特效: 3, 炮术: 3, 防御性能: 3, 翔虫使: 3 },
  操虫棍: { 攻击: 4, 看破: 5, 弱点特效: 3, 超会心: 3, 强化持续: 2 },
  轻弩炮: { 攻击: 4, 弱点特效: 3, 装填扩充: 2, 速射强化: 3, 减轻后坐力: 3 },
  重弩炮: { 攻击: 4, 弱点特效: 3, 装填扩充: 3, 弹丸节约: 3, 防御性能: 3 },
  弓: { 弱点特效: 3, 超会心: 2, 体术: 4, 耐力急速回复: 3, 解放弓的蓄力阶段: 1 }
};

const wildsWeaponPresets = {
  大剑: { 攻击: 4, 看破: 3, 弱点特效: 3, 超会心: 3, 集中: 3, 蓄力大师: 2 },
  太刀: { 攻击: 4, 看破: 3, 弱点特效: 3, 超会心: 3, 纳刀术: 3 },
  单手剑: { 攻击: 4, 看破: 4, 弱点特效: 3, 超会心: 3, 连击: 3 },
  双剑: { 攻击: 4, 看破: 4, 弱点特效: 3, 体术: 3, 耐力急速回复: 2 },
  长枪: { 攻击: 4, 弱点特效: 3, 超会心: 3, 格挡性能: 3, 攻击守势: 3 },
  铳枪: { 攻击: 4, 炮术: 3, 格挡性能: 3, 炮弹装填: 2, 攻击守势: 2 },
  大锤: { 攻击: 4, 看破: 3, 弱点特效: 3, 超会心: 3, 击晕术: 2 },
  狩猎笛: { 攻击: 4, 看破: 3, 弱点特效: 3, 超会心: 3, 吹笛名人: 1 },
  斩斧: { 攻击: 4, 弱点特效: 3, 超会心: 3, 高速变形: 3, 强化持续: 2 },
  盾斧: { 攻击: 4, 弱点特效: 3, 炮术: 3, 格挡性能: 3, 高速变形: 3 },
  操虫棍: { 攻击: 4, 看破: 4, 弱点特效: 3, 超会心: 3, 强化持续: 2 },
  轻弩炮: { 攻击: 4, 弱点特效: 3, 速射强化: 3, 弹道强化: 2, 特殊射击强化: 2 },
  重弩炮: { 攻击: 4, 弱点特效: 3, 通常弹·通常箭强化: 3, 弹道强化: 2, 特殊射击强化: 2 },
  弓: { 弱点特效: 3, 超会心: 2, 体术: 4, 耐力急速回复: 3, 蓄力大师: 2 }
};

const state = {
  data: null,
  skillMap: {},
  decosBySkill: {},
  lockedParts: {},
  excludedNames: new Set(),
  excludedDecos: new Set(),
  activeManualDecos: {},
  lastBuilds: [],
  searchWorker: null,
  searchToken: 0,
  expandedBuilds: new Set(),
  favoriteBuilds: loadFavoriteBuilds()
};

const form = document.querySelector("#buildForm");
const skillControls = document.querySelector("#skillControls");
const resultsList = document.querySelector("#resultsList");
const resultCount = document.querySelector("#resultCount");

init();

async function init() {
  try {
    resultsList.innerHTML = `<p>正在加载完整装备数据...</p>`;
    state.data = await loadData();
    state.skillMap = Object.fromEntries(state.data.skills.map((skill) => [skill.name, skill]));
    state.decosBySkill = buildDecoIndex(state.data.decorations || []);
    renderWeaponOptions();
    renderSpecificWeaponOptions();
    renderTalismanOptions();
    renderManualArmorControls();
    renderDecoExcludeOptions();
    renderSkillControls();
    fillSkillSelects();
    renderManualDecoControls();
    restoreFromUrl();
    bindEvents();
    updateDataStats();
    runSearch();
  } catch (error) {
    resultsList.innerHTML = `<p class="missing">${error.message}</p>`;
    throw error;
  }
}

async function loadData() {
  const response = await fetch(config.dataUrl);
  if (!response.ok) throw new Error(`装备数据加载失败：${response.status}`);
  return response.json();
}

function bindEvents() {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch();
  });
  document.querySelector("#resetForm").addEventListener("click", resetForm);
  document.querySelector("#copyShare").addEventListener("click", copyShareUrl);
  document.querySelector("#weaponType").addEventListener("change", () => {
    renderSpecificWeaponOptions();
    renderManualDecoControls();
    applyWeaponPreset();
  });
  document.querySelector("#weaponName")?.addEventListener("change", () => {
    renderManualDecoControls();
    runSearch();
  });
  document.querySelector("#talismanName")?.addEventListener("change", () => {
    renderManualDecoControls();
    runSearch();
  });
  document.querySelector("#addSkill").addEventListener("click", addSelectedSkillControl);
  document.querySelector("#addExcludedDeco")?.addEventListener("click", addExcludedDeco);
  document.querySelector("#resultSort")?.addEventListener("change", runSearch);
  document.querySelector("#searchScope")?.addEventListener("change", runSearch);
  document.querySelector("#stopSearch")?.addEventListener("click", stopSearch);
  document.querySelector("#favoriteImport")?.addEventListener("change", importFavoriteBuilds);
  document.querySelectorAll("[data-manual-part]").forEach((select) => select.addEventListener("change", () => {
    renderManualDecoControls();
    runSearch();
  }));
  document.querySelector("#manualDecoControls")?.addEventListener("change", runSearch);
  ["slot4", "slot3", "slot2", "slot1", "weaponSlot4", "weaponSlot3", "weaponSlot2", "weaponSlot1"].forEach((id) => {
    document.querySelector(`#${id}`)?.addEventListener("change", () => {
      renderManualDecoControls();
      runSearch();
    });
  });
  resultsList.addEventListener("click", handleResultAction);
}

function renderWeaponOptions() {
  const select = document.querySelector("#weaponType");
  select.innerHTML = state.data.weaponTypes.map((type) => `<option value="${type}">${type}</option>`).join("");
  select.value = state.data.weaponTypes.includes(config.defaultWeapon) ? config.defaultWeapon : state.data.weaponTypes[0];
}

function renderSpecificWeaponOptions() {
  const select = document.querySelector("#weaponName");
  if (!select) return;
  const type = document.querySelector("#weaponType").value;
  const weapons = state.data.weapons.filter((weapon) => weapon.type === type);
  select.innerHTML = [`<option value="">不指定具体武器</option>`]
    .concat(weapons.map((weapon) => `<option value="${weapon.name}">${weapon.name}${formatSlots(weapon.slots)}</option>`))
    .join("");
}

function renderTalismanOptions() {
  const select = document.querySelector("#talismanName");
  if (!select) return;
  const talismans = state.data.talismans || [];
  select.innerHTML = [`<option value="">不指定护石</option>`]
    .concat(talismans.map((talisman) => `<option value="${talisman.name}">${talisman.name}${formatSkillSummary(talisman.skills)}</option>`))
    .join("");
}

function renderManualArmorControls() {
  const container = document.querySelector("#manualArmorControls");
  if (!container) return;
  const parts = ["head", "chest", "arms", "waist", "legs"];
  container.innerHTML = parts
    .map((part) => {
      const armors = state.data.armors[part] || [];
      const options = [`<option value="">自动搜索</option>`]
        .concat(armors.map((armor) => `<option value="${escapeAttr(armor.name)}">${armor.slot}: ${armor.name}${formatSkillSummary(armor.skills)}${formatSlots(armor.slots)}</option>`))
        .join("");
      return `
        <label>
          ${partLabel(part)}
          <select data-manual-part="${part}">${options}</select>
        </label>
      `;
    })
    .join("");
}

function renderDecoExcludeOptions() {
  const select = document.querySelector("#decoExcludeSelect");
  if (!select) return;
  select.innerHTML = [`<option value="">选择要排除的装饰品</option>`]
    .concat((state.data.decorations || []).map((deco) => `<option value="${escapeAttr(deco.name)}">${deco.name}${deco.slot ? `【${deco.slot}】` : ""}</option>`))
    .join("");
}

function renderManualDecoControls() {
  const container = document.querySelector("#manualDecoControls");
  if (!container || !state.data) return;
  const previous = readManualDecoSelections();
  const parts = manualDecoParts();
  if (!parts.length) {
    container.innerHTML = `<p class="helper-text">选择具体武器、护石或指定防具后，这里会显示可手动安装的孔位。</p>`;
    return;
  }
  container.innerHTML = parts
    .map((part) => {
      const slots = toSlotObjects(part);
      if (!slots.length) return "";
      const slotHtml = slots
        .map((slot, index) => {
          const key = manualDecoKey(part.part, index);
          const options = decorationOptionsForSlot(slot, previous[key]);
          return `
            <label>
              ${part.slot}${index + 1}：${slotLabel(slot)}
              <select data-manual-deco="${key}" data-slot-level="${slot.level}" data-slot-type="${slot.type}">
                ${options}
              </select>
            </label>
          `;
        })
        .join("");
      return `
        <div class="manual-deco-group">
          <strong>${part.slot}: ${part.name}</strong>
          <div class="manual-grid">${slotHtml}</div>
        </div>
      `;
    })
    .join("") || `<p class="helper-text">当前装备没有可用孔位。</p>`;
}

function manualDecoParts() {
  const parts = [readWeapon()];
  for (const part of ["head", "chest", "arms", "waist", "legs"]) {
    const name = selectedManualArmorName(part);
    if (!name) continue;
    const armor = state.data.armors[part].find((item) => item.name === name);
    if (armor) parts.push(armor);
  }
  parts.push(readCharm());
  return parts.filter((part) => part && (part.slots || []).length);
}

function decorationOptionsForSlot(slot, selectedName = "") {
  const options = [`<option value="">自动补珠 / 空孔</option>`];
  const decos = (state.data.decorations || [])
    .filter((deco) => !state.excludedDecos.has(deco.name))
    .map((deco) => ({ ...deco, type: normalizeDecorationType(deco.type) }))
    .filter((deco) => slot.level >= deco.slot && canUseDecoration(slot, deco))
    .sort((a, b) => a.slot - b.slot || a.name.localeCompare(b.name, "zh-Hans"));
  decos.forEach((deco) => {
    const selected = deco.name === selectedName ? " selected" : "";
    options.push(`<option value="${escapeAttr(deco.name)}"${selected}>${deco.name}${formatSkillSummary(deco.skills)}</option>`);
  });
  return options.join("");
}

function renderSkillControls() {
  const preset = activeWeaponPresets()[config.defaultWeapon] || {};
  const ordered = [...new Set(activeDefaultTargetSkills().concat(Object.keys(preset)))].filter((name) => state.skillMap[name]);
  skillControls.innerHTML = ordered.map((name) => skillInputHtml(name, 0)).join("");
}

function skillInputHtml(name, value) {
  const skill = state.skillMap[name] || { name, max: 7 };
  return `
    <label class="skill-control">
      <span>${skill.name}</span>
      <input data-skill="${skill.name}" type="number" min="0" max="${skill.max}" value="${value}" aria-label="${skill.name}目标等级" />
    </label>
  `;
}

function fillSkillSelects() {
  const options = [`<option value="">无</option>`]
    .concat(state.data.skills.map((skill) => `<option value="${skill.name}">${skill.name}</option>`))
    .join("");
  document.querySelector("#charmSkillA").innerHTML = options;
  document.querySelector("#charmSkillB").innerHTML = options;
  document.querySelector("#extraSkill").innerHTML = state.data.skills
    .map((skill) => `<option value="${skill.name}">${skill.name}</option>`)
    .join("");
  document.querySelector("#charmSkillA").value = state.skillMap["攻击"] ? "攻击" : "";
  document.querySelector("#charmSkillB").value = state.skillMap["弱点特效"] ? "弱点特效" : "";
}

function updateDataStats() {
  const stats = document.querySelector("#dataStats");
  if (!stats) return;
  const counts = state.data.counts;
  const talismanText = counts.talismans ? `、${counts.talismans} 个护石` : "";
  stats.textContent = `数据版本 ${state.data.version}：${counts.armors} 件防具、${counts.weapons} 把武器、${counts.skills} 个技能、${counts.decorations} 个装饰品${talismanText}`;
}

function addSelectedSkillControl() {
  const selected = document.querySelector("#extraSkill").value;
  if (!selected || document.querySelector(`[data-skill="${cssEscape(selected)}"]`)) return;
  skillControls.insertAdjacentHTML("beforeend", skillInputHtml(selected, 1));
}

function applyWeaponPreset() {
  const selected = document.querySelector("#weaponType").value;
  setTargets(activeWeaponPresets()[selected] || {});
  runSearch();
}

function setTargets(targets) {
  Object.entries(targets).forEach(([name, level]) => ensureSkillControl(name, level));
  document.querySelectorAll("[data-skill]").forEach((input) => {
    input.value = targets[input.dataset.skill] || 0;
  });
}

function ensureSkillControl(name, value = 0) {
  if (document.querySelector(`[data-skill="${cssEscape(name)}"]`)) return;
  skillControls.insertAdjacentHTML("beforeend", skillInputHtml(name, value));
}

function readTargets() {
  const targets = {};
  document.querySelectorAll("[data-skill]").forEach((input) => {
    const value = Number(input.value);
    if (value > 0) targets[input.dataset.skill] = value;
  });
  return targets;
}

function readCharm() {
  const selectedTalisman = getSelectedTalisman();
  const skills = { ...(selectedTalisman?.skills || {}) };
  addSkill(skills, document.querySelector("#charmSkillA").value, Number(document.querySelector("#charmLevelA").value));
  addSkill(skills, document.querySelector("#charmSkillB").value, Number(document.querySelector("#charmLevelB").value));
  return {
    name: selectedTalisman?.name || "自定义护石",
    slot: "护石",
    part: "charm",
    skills,
    slots: [
      ...(selectedTalisman?.slots || []),
      ...Array(Number(document.querySelector("#slot4").value)).fill(4),
      ...Array(Number(document.querySelector("#slot3").value)).fill(3),
      ...Array(Number(document.querySelector("#slot2").value)).fill(2),
      ...Array(Number(document.querySelector("#slot1").value)).fill(1)
    ],
    defense: 0
  };
}

function readWeapon() {
  const selectedWeapon = getSelectedWeapon();
  return {
    name: selectedWeapon?.name || `${document.querySelector("#weaponType").value}武器孔位`,
    slot: "武器",
    part: "weapon",
    skills: selectedWeapon?.skills || {},
    slots: [
      ...(selectedWeapon?.slots || []),
      ...Array(Number(document.querySelector("#weaponSlot4").value)).fill(4),
      ...Array(Number(document.querySelector("#weaponSlot3").value)).fill(3),
      ...Array(Number(document.querySelector("#weaponSlot2").value)).fill(2),
      ...Array(Number(document.querySelector("#weaponSlot1").value)).fill(1)
    ],
    defense: 0
  };
}

function getSelectedWeapon() {
  const select = document.querySelector("#weaponName");
  if (!select?.value) return null;
  return state.data.weapons.find((weapon) => weapon.name === select.value) || null;
}

function getSelectedTalisman() {
  const select = document.querySelector("#talismanName");
  if (!select?.value) return null;
  return (state.data.talismans || []).find((talisman) => talisman.name === select.value) || null;
}

function runSearch() {
  try {
    stopSearch(false);
    const targets = readTargets();
    const charm = readCharm();
    const weapon = readWeapon();
    const limit = Number(document.querySelector("#resultLimit").value) || 8;
    const searchScope = readSearchScope();
    state.activeManualDecos = readManualDecoSelections();
    if (!Object.keys(targets).length) {
      resultsList.innerHTML = `<p class="missing">请先填写目标技能，或选择武器模板。</p>`;
      resultCount.textContent = "等待目标技能";
      return;
    }

    const candidateParts = selectCandidates(targets, searchScope);
    const comboCount = comboCountFor(candidateParts);
    if (!comboCount) {
      state.lastBuilds = [];
      renderResults([], targets, candidateParts, 0);
      return;
    }
    startSearchWorker({ candidateParts, charm, weapon, targets, limit, comboCount, searchScope });
  } catch (error) {
    resultsList.innerHTML = `<p class="missing">搜索失败：${error.message}</p>`;
    throw error;
  }
}

function startSearchWorker({ candidateParts, charm, weapon, targets, limit, comboCount, searchScope }) {
  const token = state.searchToken + 1;
  state.searchToken = token;
  state.expandedBuilds.clear();
  setSearchBusy(true);
  resultCount.textContent = `搜索中 0% · ${scopeLabel(searchScope)} · ${comboCount.toLocaleString()} 组候选`;
  resultsList.innerHTML = `${renderShareTools()}${renderActiveRules()}${renderFavoriteBuilds()}<p class="helper-text">正在后台计算配装，请稍候...</p>`;
  const payload = {
    game: config.game,
    candidateParts,
    charm,
    weapon,
    targets,
    limit,
    comboCount,
    searchScope,
    sortMode: getSortMode(),
    skillMap: state.skillMap,
    decosBySkill: state.decosBySkill,
    excludedDecos: [...state.excludedDecos],
    manualDecos: state.activeManualDecos
  };
  if (!window.Worker) {
    if (searchScope === "full") {
      finishSearchError("当前浏览器不支持后台 Worker，无法执行全量搜索。请切换到智能推荐或更换浏览器。", token);
      return;
    }
    finishSearch(runSearchSync(payload), targets, candidateParts, comboCount, token);
    return;
  }
  try {
    const worker = new Worker("search-worker.js");
    state.searchWorker = worker;
    worker.onmessage = (event) => {
      if (token !== state.searchToken) return;
      const message = event.data || {};
      if (message.type === "progress") {
        const percent = Math.min(99, Math.floor((message.done / comboCount) * 100));
        resultCount.textContent = `搜索中 ${percent}% · ${scopeLabel(searchScope)} · ${message.done.toLocaleString()} / ${comboCount.toLocaleString()} 组`;
      }
      if (message.type === "done") {
        finishSearch(message.builds || [], targets, candidateParts, comboCount, token);
      }
      if (message.type === "error") {
        if (searchScope === "full") finishSearchError(message.message || "全量搜索失败，请调整条件后重试。", token);
        else finishSearch(runSearchSync(payload), targets, candidateParts, comboCount, token);
      }
    };
    worker.onerror = () => {
      if (searchScope === "full") finishSearchError("全量搜索 Worker 发生错误，请调整条件后重试。", token);
      else finishSearch(runSearchSync(payload), targets, candidateParts, comboCount, token);
    };
    worker.postMessage(payload);
  } catch {
    if (searchScope === "full") finishSearchError("全量搜索 Worker 启动失败，请调整条件后重试。", token);
    else finishSearch(runSearchSync(payload), targets, candidateParts, comboCount, token);
  }
}

function runSearchSync(payload) {
  return enumerateCandidateCombos(payload.candidateParts, payload.charm, payload.weapon)
    .map((parts) => evaluateBuild(parts, payload.targets))
    .sort((a, b) => compareBuilds(a, b, payload.sortMode))
    .slice(0, payload.limit);
}

function finishSearch(builds, targets, candidateParts, comboCount, token) {
  if (token !== state.searchToken) return;
  stopSearch(false);
  state.lastBuilds = builds;
  renderResults(builds, targets, candidateParts, comboCount);
}

function finishSearchError(message, token) {
  if (token !== state.searchToken) return;
  stopSearch(false);
  resultsList.innerHTML = `${renderShareTools()}${renderFavoriteBuilds()}<p class="missing">${message}</p>`;
  resultCount.textContent = "搜索失败";
}

function stopSearch(showStopped = true) {
  if (state.searchWorker) {
    state.searchWorker.terminate();
    state.searchWorker = null;
  }
  setSearchBusy(false);
  if (showStopped) {
    state.searchToken += 1;
    resultCount.textContent = state.lastBuilds.length ? `已停止 · 保留 ${state.lastBuilds.length} 套结果` : "已停止搜索";
  }
}

function setSearchBusy(isBusy) {
  const stopButton = document.querySelector("#stopSearch");
  if (stopButton) stopButton.hidden = !isBusy;
}

function selectCandidates(targets, searchScope = readSearchScope()) {
  const parts = {};
  const limit = SEARCH_SCOPE_LIMITS[searchScope] || SEARCH_SCOPE_LIMITS.smart;
  for (const part of ["head", "chest", "arms", "waist", "legs"]) {
    const manualArmor = selectedManualArmorName(part);
    const fixedArmorName = manualArmor || state.lockedParts[part];
    if (fixedArmorName) {
      const locked = state.data.armors[part].find((armor) => armor.name === fixedArmorName);
      parts[part] = locked ? [locked] : [];
      continue;
    }
    const scored = state.data.armors[part]
      .filter((armor) => !state.excludedNames.has(armor.name))
      .map((armor) => ({ armor, score: candidateScore(armor, targets) }))
      .sort((a, b) => b.score - a.score || b.armor.defense - a.armor.defense);
    parts[part] = (Number.isFinite(limit) ? scored.slice(0, limit) : scored).map((entry) => entry.armor);
  }
  return parts;
}

function candidateScore(armor, targets) {
  const skillScore = Object.entries(targets).reduce((sum, [skill, target]) => {
    return sum + Math.min(armor.skills[skill] || 0, target) * 36;
  }, 0);
  const slotScore = armor.slots.reduce((sum, slot) => sum + slot * 2, 0);
  const targetSlotScore = armor.slots.reduce((sum, slot) => {
    return sum + (Object.keys(targets).some((skill) => slot >= decoSize(skill)) ? 4 : 0);
  }, 0);
  return skillScore + slotScore + targetSlotScore + armor.defense / 80;
}

function enumerateCandidateCombos(parts, charm, weapon) {
  const combos = [];
  for (const head of parts.head) {
    for (const chest of parts.chest) {
      for (const arms of parts.arms) {
        for (const waist of parts.waist) {
          for (const legs of parts.legs) {
            combos.push([weapon, head, chest, arms, waist, legs, charm]);
          }
        }
      }
    }
  }
  return combos;
}

function comboCountFor(parts) {
  return Object.values(parts).reduce((sum, list) => sum * list.length, 1);
}

function readSearchScope() {
  const value = document.querySelector("#searchScope")?.value || "smart";
  return SEARCH_SCOPE_LIMITS[value] ? value : "smart";
}

function scopeLabel(scope) {
  return { smart: "智能推荐", deep: "深度搜索", full: "全量搜索" }[scope] || "智能推荐";
}

function evaluateBuild(parts, targets) {
  const total = {};
  const slots = [];
  let defense = 0;
  parts.forEach((part) => {
    Object.entries(part.skills).forEach(([name, level]) => addSkill(total, name, level));
    const partSlots = toSlotObjects(part);
    const manualDecos = manualDecorationsForPart(part, partSlots);
    manualDecos.forEach(({ deco }) => {
      Object.entries(deco.skills || {}).forEach(([name, level]) => addSkill(total, name, level));
    });
    slots.push(...partSlots.filter((slot, index) => !manualDecos.some((entry) => entry.index === index)));
    defense += part.defense || 0;
  });

  const decorations = manualDecorationsForBuild(parts).map(({ deco }) => deco.name);
  const openSlots = [...slots].sort(compareSlots);
  Object.entries(targets)
    .sort((a, b) => decoSize(b[0]) - decoSize(a[0]))
    .forEach(([name, targetLevel]) => {
      while ((total[name] || 0) < targetLevel) {
        const slotIndex = openSlots.findIndex((slot) => bestDecoForSlot(name, slot));
        if (slotIndex === -1) break;
        const [slot] = openSlots.splice(slotIndex, 1);
        const decoration = bestDecoForSlot(name, slot);
        const gained = Math.min(decoration.level || 1, targetLevel - (total[name] || 0));
        addSkill(total, name, gained);
        decorations.push(decoration.name);
      }
    });

  const missing = Object.entries(targets).filter(([name, targetLevel]) => (total[name] || 0) < targetLevel);
  const achievedLevels = Object.entries(targets).reduce((sum, [name, targetLevel]) => sum + Math.min(total[name] || 0, targetLevel), 0);
  const requiredLevels = Object.values(targets).reduce((sum, targetLevel) => sum + targetLevel, 0);
  const completion = requiredLevels ? Math.round((achievedLevels / requiredLevels) * 100) : 0;
  const targetScore = Object.entries(targets).reduce((sum, [name, targetLevel]) => {
    const current = Math.min(total[name] || 0, targetLevel);
    return sum + current * 18;
  }, 0);
  const openSlotScore = openSlots.reduce((sum, slot) => sum + slot.level, 0);
  const overcapScore = Object.entries(targets).reduce((sum, [name, targetLevel]) => sum + Math.max(0, (total[name] || 0) - targetLevel), 0);
  const score = targetScore + openSlotScore + overcapScore + defense / 120 - missing.length * 28;

  return { parts, total, decorations, missing, openSlots, openSlotScore, score, defense, completion };
}

function buildDecoIndex(decorations) {
  const index = {};
  decorations.forEach((deco) => {
    Object.entries(deco.skills || {}).forEach(([skill, level]) => {
      if (!index[skill]) index[skill] = [];
      index[skill].push({
        name: deco.name,
        slot: deco.slot,
        level,
        type: normalizeDecorationType(deco.type)
      });
    });
  });
  Object.values(index).forEach((list) => {
    list.sort((a, b) => a.slot - b.slot || b.level - a.level || a.name.localeCompare(b.name, "zh-Hans"));
  });
  return index;
}

function decoSize(skillName) {
  return state.decosBySkill[skillName]?.[0]?.slot || state.skillMap[skillName]?.deco || 4;
}

function bestDecoForSlot(skillName, slot) {
  const decorations = state.decosBySkill[skillName] || [];
  return decorations.find((deco) => !state.excludedDecos.has(deco.name) && slot.level >= deco.slot && canUseDecoration(slot, deco));
}

function canUseDecoration(slot, decoration) {
  if (config.game !== "wilds") return true;
  if (decoration.type === "preserver") return slot.type !== "weapon";
  return slot.type === decoration.type;
}

function normalizeDecorationType(type) {
  if (config.game !== "wilds") return "any";
  if (type === "weapon") return "weapon";
  if (type === "preserver") return "preserver";
  return "equip";
}

function manualDecorationsForBuild(parts) {
  return parts.flatMap((part) => manualDecorationsForPart(part, toSlotObjects(part)));
}

function manualDecorationsForPart(part, slots) {
  const selections = state.activeManualDecos || {};
  return slots
    .map((slot, index) => {
      const name = selections[manualDecoKey(part.part, index)];
      if (!name) return null;
      const deco = findDecorationByName(name);
      if (!deco || deco.slot > slot.level || !canUseDecoration(slot, deco)) return null;
      return { index, deco };
    })
    .filter(Boolean);
}

function findDecorationByName(name) {
  const deco = (state.data.decorations || []).find((item) => item.name === name);
  return deco ? { ...deco, type: normalizeDecorationType(deco.type) } : null;
}

function toSlotObjects(part) {
  const type = slotTypeForPart(part.part);
  return (part.slots || []).map((level) => ({ level, type }));
}

function slotTypeForPart(partName) {
  if (config.game !== "wilds") return "any";
  return partName === "weapon" ? "weapon" : "equip";
}

function compareSlots(a, b) {
  return a.level - b.level || a.type.localeCompare(b.type);
}

function manualDecoKey(part, index) {
  return `${part}:${index}`;
}

function readManualDecoSelections() {
  const selected = {};
  document.querySelectorAll("[data-manual-deco]").forEach((select) => {
    if (select.value) selected[select.dataset.manualDeco] = select.value;
  });
  return selected;
}

function slotLabel(slot) {
  if (config.game !== "wilds" || slot.type === "any") return `${slot.level}槽`;
  return `${slot.type === "weapon" ? "武器" : "防具"}${slot.level}槽`;
}

function addSkill(target, name, level = 0) {
  if (!name || level <= 0) return;
  target[name] = (target[name] || 0) + level;
}

function renderResults(builds, targets, candidateParts, comboCount = comboCountFor(candidateParts)) {
  resultCount.textContent = `${builds.length} 套方案 · ${comboCount.toLocaleString()} 组候选`;
  resultsList.innerHTML = `${renderShareTools()}${renderActiveRules()}${renderFavoriteBuilds()}${builds.map((build, index) => renderBuild(build, index, targets)).join("")}`;
}

function renderShareTools() {
  const url = buildShareUrl();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=168x168&margin=10&data=${encodeURIComponent(url)}`;
  return `
    <div class="share-tools">
      <div>
        <strong>分享当前配装条件</strong>
        <p class="helper-text">复制链接或扫码打开同一套搜索条件。</p>
      </div>
      <img src="${qrUrl}" alt="当前配装分享二维码" loading="lazy" />
      <button class="button secondary" type="button" data-action="copy-share-url">复制链接</button>
    </div>
  `;
}

function renderBuild(build, index, targets) {
  const targetSkillHtml = Object.entries(targets)
    .map(([name, targetLevel]) => {
      const current = build.total[name] || 0;
      const className = current < targetLevel ? "missing" : "";
      return `<li class="${className}">${name} ${current}/${targetLevel}</li>`;
    })
    .join("");
  const partsHtml = build.parts.map(renderPartLine).join("");
  const decoHtml = summarizeDecorations(build.decorations)
    .map(([name, count]) => `<li>${name} x${count}</li>`)
    .join("") || `<li>无需补珠</li>`;
  const openSlots = formatSlotSummary(build.openSlots);
  const cardClass = build.missing.length ? "build-card warning" : "build-card";
  const badgeText = build.missing.length ? `完成 ${build.completion}%` : "完成 100%";
  const detailHtml = state.expandedBuilds.has(index) ? renderBuildDetail(build) : "";
  return `
    <article class="${cardClass}" data-build-index="${index}">
      <div class="build-top">
        <div>
          <p class="eyebrow">Build ${index + 1}</p>
          <h3>${build.missing.length ? "可过渡方案" : "目标达成方案"}</h3>
        </div>
        <div class="score">${badgeText}</div>
      </div>
      <ul class="parts">${partsHtml}</ul>
      <ul class="skills">${targetSkillHtml}</ul>
      ${detailHtml}
      <div>
        <strong>装饰品：</strong>
        <ul class="decorations">${decoHtml}</ul>
      </div>
      <p><strong>剩余孔位：</strong>${openSlots}　<strong>防御：</strong>${Math.round(build.defense)}</p>
      <div class="build-actions">
        <button class="button secondary" type="button" data-action="apply-build" data-index="${index}">应用到装备栏</button>
        <button class="button secondary" type="button" data-action="toggle-detail" data-index="${index}">${state.expandedBuilds.has(index) ? "收起详情" : "展开详情"}</button>
        <button class="button secondary" type="button" data-action="save-build" data-index="${index}">收藏方案</button>
        <button class="button secondary" type="button" data-action="copy-build" data-index="${index}">复制方案</button>
        <button class="button secondary" type="button" data-action="export-build-image" data-index="${index}">导出图片</button>
      </div>
    </article>
  `;
}

function renderBuildDetail(build) {
  const allSkills = Object.entries(build.total)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hans"))
    .map(([name, level]) => `<li>${name} Lv${level}</li>`)
    .join("");
  return `
    <div class="build-detail">
      <strong>全部技能：</strong>
      <ul class="skills">${allSkills}</ul>
    </div>
  `;
}

function renderPartLine(part) {
  const canTune = ["head", "chest", "arms", "waist", "legs"].includes(part.part);
  if (!canTune) return `<li>${part.slot}: ${part.name}</li>`;
  return `
    <li class="part-line">
      <span>${part.slot}: ${part.name}</span>
      <span class="part-actions">
        <button type="button" title="固定这件装备" data-action="lock" data-part="${part.part}" data-name="${escapeAttr(part.name)}">锁</button>
        <button type="button" title="排除这件装备" data-action="exclude" data-part="${part.part}" data-name="${escapeAttr(part.name)}">排</button>
      </span>
    </li>
  `;
}

function renderActiveRules() {
  const locked = Object.entries(state.lockedParts);
  const excluded = [...state.excludedNames];
  const excludedDecos = [...state.excludedDecos];
  const manual = readManualArmorNames();
  if (!locked.length && !excluded.length && !excludedDecos.length && !Object.keys(manual).length) return "";
  const lockedHtml = locked.map(([part, name]) => `<li>${partLabel(part)}固定：${name}</li>`).join("");
  const manualHtml = Object.entries(manual).map(([part, name]) => `<li>${partLabel(part)}指定：${name}</li>`).join("");
  const excludedHtml = excluded.map((name) => `<li>排除：${name}</li>`).join("");
  const excludedDecoHtml = excludedDecos.map((name) => `<li>排除珠子：${name}</li>`).join("");
  return `
    <div class="active-rules">
      <ul>${manualHtml}${lockedHtml}${excludedHtml}${excludedDecoHtml}</ul>
      <button class="button secondary" type="button" data-action="clear-rules">清除锁定/排除</button>
    </div>
  `;
}

function renderFavoriteBuilds() {
  const items = state.favoriteBuilds
    .slice(0, 8)
    .map((build, index) => `
      <li>
        <span>${build.title}</span>
        <span class="part-actions">
          <button type="button" data-action="copy-favorite" data-index="${index}">复制</button>
          <button type="button" data-action="delete-favorite" data-index="${index}">删</button>
        </span>
      </li>
    `)
    .join("");
  return `
    <div class="active-rules favorites">
      <div class="favorite-tools">
        <strong>收藏方案</strong>
        <span class="part-actions">
          <button type="button" data-action="export-favorites">导出</button>
          <button type="button" data-action="import-favorites">导入</button>
          <button type="button" data-action="clear-favorites">清空</button>
        </span>
      </div>
      ${items ? `<ul>${items}</ul>` : `<p class="helper-text">还没有收藏方案。</p>`}
    </div>
  `;
}

function handleResultAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, part, name, index } = button.dataset;
  if (action === "lock" && part && name) {
    state.lockedParts[part] = name;
    state.excludedNames.delete(name);
    runSearch();
  }
  if (action === "exclude" && name) {
    state.excludedNames.add(name);
    if (state.lockedParts[part] === name) delete state.lockedParts[part];
    runSearch();
  }
  if (action === "clear-rules") {
    state.lockedParts = {};
    state.excludedNames.clear();
    state.excludedDecos.clear();
    document.querySelectorAll("[data-manual-part]").forEach((select) => {
      select.value = "";
    });
    renderManualDecoControls();
    runSearch();
  }
  if (action === "apply-build") {
    applyBuildToManualArmor(state.lastBuilds[Number(index)]);
    renderManualDecoControls();
    runSearch();
  }
  if (action === "toggle-detail") {
    const buildIndex = Number(index);
    if (state.expandedBuilds.has(buildIndex)) state.expandedBuilds.delete(buildIndex);
    else state.expandedBuilds.add(buildIndex);
    renderResults(state.lastBuilds, readTargets(), selectCandidates(readTargets()));
  }
  if (action === "save-build") {
    const build = state.lastBuilds[Number(index)];
    if (!build) return;
    state.favoriteBuilds.unshift(buildToFavorite(build));
    state.favoriteBuilds = state.favoriteBuilds.slice(0, 30);
    saveFavoriteBuilds();
    renderResults(state.lastBuilds, readTargets(), selectCandidates(readTargets()));
  }
  if (action === "copy-build") {
    copyText(buildToText(state.lastBuilds[Number(index)]));
  }
  if (action === "export-build-image") {
    exportBuildImage(state.lastBuilds[Number(index)], Number(index) + 1);
  }
  if (action === "copy-favorite") {
    copyText(state.favoriteBuilds[Number(index)]?.text || "");
  }
  if (action === "delete-favorite") {
    state.favoriteBuilds.splice(Number(index), 1);
    saveFavoriteBuilds();
    renderResults(state.lastBuilds, readTargets(), selectCandidates(readTargets()));
  }
  if (action === "export-favorites") {
    exportFavoriteBuilds();
  }
  if (action === "import-favorites") {
    document.querySelector("#favoriteImport")?.click();
  }
  if (action === "clear-favorites") {
    state.favoriteBuilds = [];
    saveFavoriteBuilds();
    renderResults(state.lastBuilds, readTargets(), selectCandidates(readTargets()));
  }
  if (action === "copy-share-url") {
    copyShareUrl();
  }
}

function partLabel(part) {
  return { head: "头", chest: "身", arms: "腕", waist: "腰", legs: "脚" }[part] || part;
}

function selectedManualArmorName(part) {
  return document.querySelector(`[data-manual-part="${part}"]`)?.value || "";
}

function readManualArmorNames() {
  const selected = {};
  document.querySelectorAll("[data-manual-part]").forEach((select) => {
    if (select.value) selected[select.dataset.manualPart] = select.value;
  });
  return selected;
}

function applyBuildToManualArmor(build) {
  if (!build) return;
  build.parts.forEach((part) => {
    const select = document.querySelector(`[data-manual-part="${part.part}"]`);
    if (select) select.value = part.name;
  });
}

function addExcludedDeco() {
  const select = document.querySelector("#decoExcludeSelect");
  if (!select?.value) return;
  state.excludedDecos.add(select.value);
  select.value = "";
  renderManualDecoControls();
  runSearch();
}

function summarizeDecorations(decorations) {
  const countMap = new Map();
  decorations.forEach((name) => countMap.set(name, (countMap.get(name) || 0) + 1));
  return [...countMap.entries()];
}

function formatSlotSummary(slots) {
  if (!slots.length) return "无剩余孔位";
  const counts = new Map();
  slots.forEach((slot) => {
    const label = config.game === "wilds" && slot.type !== "any" ? `${slot.type === "weapon" ? "武器" : "防具"}${slot.level}槽` : `${slot.level}槽`;
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "zh-Hans", { numeric: true }))
    .map(([slot, count]) => `${slot} x${count}`)
    .join(" · ");
}

function compareBuilds(a, b, mode = getSortMode()) {
  const sortMode = mode || "match";
  if (sortMode === "defense") return b.defense - a.defense || b.score - a.score;
  if (sortMode === "slots") return b.openSlotScore - a.openSlotScore || b.score - a.score;
  return b.score - a.score || b.openSlotScore - a.openSlotScore || b.defense - a.defense;
}

function getSortMode() {
  return document.querySelector("#resultSort")?.value || "match";
}

function buildToFavorite(build) {
  const title = `${build.missing.length ? `完成 ${build.completion}%` : "目标达成"} · 防御 ${Math.round(build.defense)}`;
  return {
    title,
    text: buildToText(build),
    savedAt: new Date().toISOString()
  };
}

function buildToText(build) {
  if (!build) return "";
  const parts = build.parts.map((part) => `${part.slot}: ${part.name}`).join("\n");
  const decorations = summarizeDecorations(build.decorations).map(([name, count]) => `${name} x${count}`).join("\n") || "无需补珠";
  return [`${build.missing.length ? `完成 ${build.completion}%` : "目标达成方案"}`, parts, "装饰品:", decorations, `剩余孔位: ${formatSlotSummary(build.openSlots)}`, `防御: ${Math.round(build.defense)}`].join("\n");
}

function exportBuildImage(build, index) {
  if (!build) return;
  const lines = buildToText(build).split("\n");
  const width = 920;
  const lineHeight = 28;
  const height = Math.max(360, 72 + lines.length * lineHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#2e3b3b";
  context.fillRect(0, 0, width, height);
  const paper = context.createLinearGradient(18, 18, width - 18, height - 18);
  paper.addColorStop(0, "#fff4d5");
  paper.addColorStop(1, "#ead2a0");
  context.fillStyle = paper;
  context.strokeStyle = "#b89254";
  context.lineWidth = 3;
  roundedRect(context, 18, 18, width - 36, height - 36, 8);
  context.fill();
  context.stroke();
  context.fillStyle = "#23736a";
  context.font = "800 14px Microsoft YaHei, Noto Sans SC, Arial, sans-serif";
  context.fillText(`Monster Hunter Armor Builder · Build ${index}`, 42, 40);
  lines.forEach((line, i) => {
    context.fillStyle = "#241b13";
    context.font = `${i === 0 ? "800 24px" : "500 18px"} Microsoft YaHei, Noto Sans SC, Arial, sans-serif`;
    context.fillText(line, 42, 70 + i * lineHeight);
  });
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, `mh-build-${config.game}-${index}.png`);
  }, "image/png");
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function loadFavoriteBuilds() {
  try {
    return JSON.parse(localStorage.getItem("mh_builder_favorites") || "[]");
  } catch {
    return [];
  }
}

function saveFavoriteBuilds() {
  localStorage.setItem("mh_builder_favorites", JSON.stringify(state.favoriteBuilds));
}

function exportFavoriteBuilds() {
  const blob = new Blob([JSON.stringify(state.favoriteBuilds, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `mh-builder-favorites-${config.game}.json`;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function importFavoriteBuilds(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result || "[]"));
      if (!Array.isArray(imported)) return;
      const valid = imported.filter((item) => item && typeof item.title === "string" && typeof item.text === "string");
      state.favoriteBuilds = valid.concat(state.favoriteBuilds).slice(0, 60);
      saveFavoriteBuilds();
    renderResults(state.lastBuilds, readTargets(), selectCandidates(readTargets()));
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

async function copyText(text) {
  if (!text) return;
  await writeClipboard(text);
}

function resetForm() {
  form.reset();
  state.lockedParts = {};
  state.excludedNames.clear();
  state.excludedDecos.clear();
  document.querySelector("#weaponType").value = config.defaultWeapon;
  renderSpecificWeaponOptions();
  renderManualArmorControls();
  renderManualDecoControls();
  renderSkillControls();
  fillSkillSelects();
  renderTalismanOptions();
  renderDecoExcludeOptions();
  setTargets(activeWeaponPresets()[config.defaultWeapon] || {});
  runSearch();
}

async function copyShareUrl() {
  const url = buildShareUrl();
  await writeClipboard(url);
  const button = document.querySelector("#copyShare");
  button.textContent = "已复制";
  setTimeout(() => {
    button.textContent = "复制分享";
  }, 1400);
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function buildShareUrl() {
  const params = new URLSearchParams();
  params.set("weapon", document.querySelector("#weaponType").value);
  params.set("scope", readSearchScope());
  if (document.querySelector("#weaponName")?.value) params.set("weaponName", document.querySelector("#weaponName").value);
  if (document.querySelector("#talismanName")?.value) params.set("talismanName", document.querySelector("#talismanName").value);
  Object.entries(state.lockedParts).forEach(([part, name]) => params.set(`lock:${part}`, name));
  [...state.excludedNames].forEach((name) => params.append("exclude", name));
  [...state.excludedDecos].forEach((name) => params.append("excludeDeco", name));
  Object.entries(readManualArmorNames()).forEach(([part, name]) => params.set(`manual:${part}`, name));
  Object.entries(readManualDecoSelections()).forEach(([key, name]) => params.set(`deco:${key}`, name));
  Object.entries(readTargets()).forEach(([name, level]) => params.set(`skill:${name}`, level));
  ["charmSkillA", "charmLevelA", "charmSkillB", "charmLevelB", "slot4", "slot3", "slot2", "slot1", "weaponSlot4", "weaponSlot3", "weaponSlot2", "weaponSlot1"].forEach((id) => {
    params.set(id, document.querySelector(`#${id}`).value);
  });
  return `${location.origin}${location.pathname}?${params.toString()}#${config.anchor}`;
}

function restoreFromUrl() {
  const params = new URLSearchParams(location.search);
  const hasSharedSkills = [...params.keys()].some((key) => key.startsWith("skill:"));
  const weapon = params.get("weapon");
  const scope = params.get("scope");
  if (scope && SEARCH_SCOPE_LIMITS[scope] && document.querySelector("#searchScope")) {
    document.querySelector("#searchScope").value = scope;
  }
  if (weapon && state.data.weaponTypes.includes(weapon)) {
    document.querySelector("#weaponType").value = weapon;
    renderSpecificWeaponOptions();
  }
  if (params.get("weaponName") && document.querySelector("#weaponName")) document.querySelector("#weaponName").value = params.get("weaponName");
  if (params.get("talismanName") && document.querySelector("#talismanName")) document.querySelector("#talismanName").value = params.get("talismanName");
  if (!params.size || !hasSharedSkills) {
    setTargets(activeWeaponPresets()[document.querySelector("#weaponType").value] || activeWeaponPresets()[config.defaultWeapon] || {});
    return;
  }
  for (const [key, value] of params.entries()) {
    if (!key.startsWith("skill:")) continue;
    const name = key.slice(6);
    ensureSkillControl(name, Number(value));
    document.querySelector(`[data-skill="${cssEscape(name)}"]`).value = value;
  }
  for (const [key, value] of params.entries()) {
    if (key.startsWith("lock:")) state.lockedParts[key.slice(5)] = value;
    if (key === "exclude") state.excludedNames.add(value);
    if (key === "excludeDeco") state.excludedDecos.add(value);
    if (key.startsWith("manual:")) {
      const select = document.querySelector(`[data-manual-part="${key.slice(7)}"]`);
      if (select) select.value = value;
    }
  }
  renderManualDecoControls();
  for (const [key, value] of params.entries()) {
    if (!key.startsWith("deco:")) continue;
    const select = document.querySelector(`[data-manual-deco="${cssEscape(key.slice(5))}"]`);
    if (select) select.value = value;
  }
  ["charmSkillA", "charmLevelA", "charmSkillB", "charmLevelB", "slot4", "slot3", "slot2", "slot1", "weaponSlot4", "weaponSlot3", "weaponSlot2", "weaponSlot1"].forEach((id) => {
    const value = params.get(id);
    if (value !== null) document.querySelector(`#${id}`).value = value;
  });
}

function formatSlots(slots = []) {
  return slots.length ? ` [${slots.join("-")}]` : "";
}

function formatSkillSummary(skills = {}) {
  const entries = Object.entries(skills);
  return entries.length ? ` ${entries.map(([name, level]) => `${name}${level}`).join(" ")}` : "";
}

function cssEscape(value) {
  return window.CSS?.escape ? CSS.escape(value) : value.replace(/["\\]/g, "\\$&");
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function activeDefaultTargetSkills() {
  return config.game === "wilds" ? wildsDefaultTargetSkills : sunbreakDefaultTargetSkills;
}

function activeWeaponPresets() {
  return config.game === "wilds" ? wildsWeaponPresets : sunbreakWeaponPresets;
}
