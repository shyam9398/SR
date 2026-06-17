import appState from '../../core/appState.js';
import { showToast, v11Confirm, v10Esc } from '../../utils/helpers.js';

function getSA() {
  return appState.subAdminData || {};
}

function saUsername() {
  const sa = getSA();
  return sa.username || sa.id || '';
}

function saBranch() {
  return getSA().branch || '';
}

function isCurrentSubjectOwned() {
  const currentSubj = window._v10SASubj;
  if (!currentSubj) return true;
  const sa = getSA();
  if (!sa.username) return true;
  if (appState.adminType === 'admin') return true;
  return currentSubj.created_by === sa.username;
}

export async function v10SASubjects() {
  const content = document.getElementById('sa-content');
  if (!content) return;

  const sa = getSA();
  const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const unis = ['JNTUK', 'JNTUH', 'Andhra University'];
  const regs = ['R23', 'R20', 'R19', 'R16'];
  const branches = ['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'AIDS', 'MECH', 'CIVIL'];

  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;text-align:center;">
    <div class="loading-spinner" style="margin: 3rem auto 1rem;"></div>
    <p style="color:var(--text3);">Fetching your subjects from Supabase...</p>
  </div>`;

  let mySubs = [];
  if (window.aimeasyFetchSubjects) {
    const filters = {};
    if (sa.username) filters.created_by_subadmin_id = sa.username;
    else if (sa.branch) filters.branch = sa.branch;

    console.log('[SubAdmin-Fix] Fetching isolated subjects', filters);
    const { data, error } = await window.aimeasyFetchSubjects(filters);
    if (error) {
      content.innerHTML = `
      <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;text-align:center;">
        <p style="color:var(--red);">Failed to load subjects: ${error.message}</p>
        <button class="btn btn-primary btn-sm" style="margin-top:1rem;" onclick="window.v10SASubjects()">Retry</button>
      </div>`;
      return;
    }
    mySubs = data || [];
  }

  const createForm = `
  <div class="v10-create-form" id="v10-sa-create-form" style="display:none;">
    <h3 style="margin-bottom:1rem;font-size:1rem;">📚 Create New Subject</h3>
    <div class="v10-2col">
      <div class="input-group">
        <label>Branch</label>
        <select class="select" id="v10-sa-branch">
          <option value="">Select Branch</option>
          ${branches.map(b => `<option value="${b}"${sa.branch === b ? ' selected' : ''}>${b}</option>`).join('')}
        </select>
      </div>
      <input type="hidden" id="v10-sa-year" value="">
    </div>
    <div class="v10-2col">
      <div class="input-group">
        <label>Semester</label>
        <select class="select" id="v10-sa-sem">
          <option value="">Select Semester</option>
          ${allSems.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <div class="input-group">
        <label>Regulation</label>
        <select class="select" id="v10-sa-reg">
          <option value="">Select Regulation</option>
          ${regs.map(r => `<option value="${r}">${r}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="v10-2col">
      <div class="input-group">
        <label>University</label>
        <select class="select" id="v10-sa-uni">
          <option value="">Select University</option>
          ${unis.map(u => `<option value="${u}">${u}</option>`).join('')}
        </select>
      </div>
      <input type="hidden" id="v10-sa-credits" value="3">
    </div>
    <div class="v10-2col">
      <div class="input-group">
        <label>Subject Name</label>
        <input class="input" id="v10-sa-name" placeholder="e.g. Machine Learning">
      </div>
      <input type="hidden" id="v10-sa-code" value="">
    </div>
    <div style="display:flex;gap:10px;margin-top:.5rem;">
      <button class="btn btn-primary" id="v10-sa-create-btn" onclick="window.__v10SACreateSubjectFixed()" style="flex:1;">✅ Create Subject</button>
      <button class="btn btn-ghost" onclick="document.getElementById('v10-sa-create-form').style.display='none'">Cancel</button>
    </div>
  </div>`;

  const cards = mySubs.map(s => {
    const safeName = (s.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const safeId = s.id;
    return `
    <div class="v10-subj-card" onclick="window.v10SAOpenUnits('${safeId}')">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;">
        <div class="v10-subj-icon">📖</div>
        <div class="v10-dot-wrap" onclick="event.stopPropagation()">
          <button class="v10-dot-btn" onclick="window.v10SaDotMenu(this,'${safeId}','${safeName}')">⋯</button>
        </div>
      </div>
      <div class="v10-subj-name">${v10Esc(s.name)}</div>
      <div class="v10-subj-meta">${v10Esc(s.code || '—')} · ${v10Esc(s.credits || 3)} Cr · ${v10Esc(s.branch || 'CSE')}</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px;">
        <span class="badge badge-primary">${v10Esc(s.semester || '—')}</span>
        <span class="badge badge-teal">${v10Esc(s.university_name || 'JNTUK')}</span>
        <span class="badge badge-lavender">${v10Esc(s.regulation_code || 'R23')}</span>
        <span class="badge badge-amber">My Subject ✓</span>
      </div>
      <div class="v10-arrow">📋 Click to manage units →</div>
    </div>`;
  }).join('');

  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;flex-wrap:wrap;gap:10px;">
      <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-.02em;">📚 My Subjects (${mySubs.length})</h2>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" onclick="window.v10SASubjects()">🔄 Refresh</button>
        <button class="btn btn-primary" onclick="document.getElementById('v10-sa-create-form').style.display='block';document.getElementById('v10-sa-create-form').scrollIntoView({behavior:'smooth'})">+ Add Subject</button>
      </div>
    </div>
    ${createForm}
    ${mySubs.length
      ? `<div class="v10-subj-grid">${cards}</div>`
      : `<div style="text-align:center;padding:4rem;color:var(--text3);">
          <div style="font-size:3rem;margin-bottom:1rem;">📚</div>
          <div style="font-weight:600;font-size:1rem;margin-bottom:6px;">No subjects yet</div>
          <div style="font-size:.82rem;">Click "+ Add Subject" to create your first subject</div>
        </div>`}
  </div>`;
}

export async function __v10SACreateSubjectFixed() {
  const btn = document.getElementById('v10-sa-create-btn');
  if (btn?.disabled) return;

  const branch = document.getElementById('v10-sa-branch')?.value;
  const sem = document.getElementById('v10-sa-sem')?.value;
  const reg = document.getElementById('v10-sa-reg')?.value;
  const uni = document.getElementById('v10-sa-uni')?.value;
  const name = document.getElementById('v10-sa-name')?.value.trim();
  const credits = document.getElementById('v10-sa-credits')?.value || '3';

  if (!branch || !sem || !reg || !uni || !name) {
    showToast('Please fill all required fields', 'red');
    return;
  }
  if (!window.aimeasyCreateSubject) {
    showToast('Supabase not ready. Please wait and try again.', 'red');
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Creating...'; }

  const username = saUsername();
  const dbPayload = {
    name,
    code: '',
    university_name: uni,
    regulation_code: reg,
    branch,
    semester: sem,
    credits: Number(credits) || 3,
    ...(username ? { createdBy: username } : {}),
  };

  showToast('Saving to Supabase...', 'blue');
  const { data, error } = await window.aimeasyCreateSubject(dbPayload);

  if (error) {
    showToast('❌ Failed: ' + error.message, 'red');
    if (btn) { btn.disabled = false; btn.textContent = '✅ Create Subject'; }
    return;
  }
  if (!data?.id) {
    showToast('❌ No row returned – check Supabase RLS policies.', 'red');
    if (btn) { btn.disabled = false; btn.textContent = '✅ Create Subject'; }
    return;
  }

  showToast('✅ Subject created!', 'green');
  await window.v10SASubjects();
}

export async function v10SAOpenUnits(subjId) {
  document.querySelectorAll(".v10-popup").forEach(p => p.remove());
  const saContent = document.getElementById("sa-content");
  if (saContent) saContent.innerHTML = "<div style=\"padding:2rem;text-align:center;\"><div class=\"loading-spinner\" style=\"margin: 3rem auto 1rem;\"></div><p style=\"color:var(--text3);\">Opening Units...</p></div>";

  if (!window.aimeasyFetchSubjects) {
    showToast('Supabase not ready', 'red');
    return;
  }

  const { data: allSubjects, error } = await window.aimeasyFetchSubjects({});
  if (error) { showToast('Could not load subject: ' + error.message, 'red'); return; }
  const subj = (allSubjects || []).find(s => String(s.id) === String(subjId));
  if (!subj) { showToast('Subject not found in database', 'red'); return; }

  const normalizedSubj = {
    id: subj.id,
    name: subj.name,
    code: subj.code || '',
    sem: subj.semester || '',
    semester: subj.semester || '',
    uni: subj.university_name || 'JNTUK',
    university_name: subj.university_name || 'JNTUK',
    reg: subj.regulation_code || 'R23',
    regulation_code: subj.regulation_code || 'R23',
    branch: subj.branch || 'CSE',
    credits: subj.credits || 3,
    created_by: subj.created_by
  };

  window._v10SASubj = normalizedSubj;
  await window.v10SAUnitsPage(normalizedSubj);
}

export async function v10SAUnitsPage(subj) {
  if (!subj?.id) return;
  window._v10SASubj = subj;
  const content = document.getElementById('sa-content');
  if (!content) return;

  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;text-align:center;">
    <div class="loading-spinner" style="margin: 3rem auto 1rem;"></div>
    <p style="color:var(--text3);">Loading units from Supabase...</p>
  </div>`;

  let uList = [];
  if (window.aimeasyFetchUnits) {
    const { data: dbUnits, error } = await window.aimeasyFetchUnits(subj.id);
    if (error) {
      showToast('Failed to load units: ' + error.message, 'red');
    } else {
      uList = (dbUnits || []).map(u => ({
        id: u.id,
        sort_order: u.sort_order,
        name: u.title || u.name || `Unit ${u.sort_order}`,
        description: u.description || '',
      }));
    }
  }

  const isOwner = isCurrentSubjectOwned();

  const cards = uList.map(u => `
    <div class="v10-unit-card"
      onclick="window.__v10SAUnitDetailOnce('${subj.id}','${u.id}',this)"
      style="cursor:pointer;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
        <div class="v10-unit-num">${u.sort_order || u.id}</div>
        ${isOwner ? `
        <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
          <button class="v10-dot-btn" onclick="window.v10SAEditUnit('${subj.id}','${u.id}')" title="Edit" style="font-size:.8rem;">✏️</button>
          <button class="v10-dot-btn" onclick="window.__v10SADeleteUnitFixed('${subj.id}','${u.id}')" title="Delete" style="font-size:.8rem;color:var(--red);">🗑</button>
        </div>` : ''}
      </div>
      <div class="v10-unit-name">${v10Esc(u.name)}</div>
      <div class="v10-unit-meta">${isOwner ? 'Click to add roadmap &amp; content' : 'Click to view roadmap &amp; content'}</div>
      <div class="v10-unit-badges"><span class="badge badge-amber">DB ✓</span></div>
      <div class="v10-unit-arrow">${isOwner ? 'Click to manage →' : 'Click to view →'}</div>
    </div>`).join('');

  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
    <button class="back-btn" onclick="window._v10SASubj=null;window.v10SASubjects();">← Back to Subjects</button>
    <div style="margin:1rem 0 .5rem;">
      <h2 style="font-size:1.25rem;font-weight:800;letter-spacing:-.02em;margin-bottom:6px;">📖 ${v10Esc(subj.name)}</h2>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <span class="badge badge-primary">${v10Esc(subj.sem || subj.semester || '—')}</span>
        <span class="badge badge-teal">${v10Esc(subj.uni || subj.university_name || 'JNTUK')}</span>
        <span class="badge badge-lavender">${v10Esc(subj.reg || subj.regulation_code || 'R23')}</span>
        <span class="badge badge-amber">${v10Esc(subj.branch || 'CSE')}</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.4rem;">
      <p style="font-size:.79rem;color:var(--text3);">${isOwner ? 'Click a unit to manage roadmap &amp; content' : 'Click a unit to view roadmap &amp; content'}</p>
      ${isOwner ? `<button class="btn btn-primary btn-sm" onclick="window.v10SAAddUnit('${subj.id}')">+ Add Unit</button>` : ''}
    </div>
    ${uList.length
      ? `<div class="v10-unit-grid">${cards}</div>`
      : `<div style="text-align:center;padding:3rem;color:var(--text3);">
          <div style="font-size:3rem;margin-bottom:1rem;">📚</div>
          <div style="font-weight:600;">No units yet</div>
          <div style="font-size:.82rem;">${isOwner ? 'Click "+ Add Unit" to create units' : 'No units added yet.'}</div>
        </div>`}
  </div>`;
}

export function __v10SAUnitDetailOnce(subjId, unitId, cardEl) {
  if (cardEl?._opening) return;
  if (cardEl) cardEl._opening = true;
  setTimeout(() => { if (cardEl) cardEl._opening = false; }, 1500);
  window.v10SAUnitDetail(subjId, unitId);
}

export async function __v10SADeleteUnitFixed(subjId, unitId) {
  if (!confirm('Delete this unit and all its content?')) return;
  if (!window.aimeasyDeleteUnit) { showToast('Supabase not ready', 'red'); return; }
  showToast('Deleting...', 'blue');
  const { error } = await window.aimeasyDeleteUnit(unitId);
  if (error) { showToast('Delete failed: ' + error.message, 'red'); return; }
  showToast('Unit deleted', 'red');
  if (window._v10SASubj) await window.v10SAUnitsPage(window._v10SASubj);
}

export async function v10SAUnitDetail(subjId, unitId) {
  window._v10SASubjId = subjId;
  window._v10SAUnitId = unitId;
  const saContent = document.getElementById("sa-content");
  if (saContent) saContent.innerHTML = "<div style=\"padding:2rem;text-align:center;\"><div class=\"loading-spinner\" style=\"margin: 3rem auto 1rem;\"></div><p style=\"color:var(--text3);\">Opening Unit...</p></div>";
  const subj = window._v10SASubj || (window.findSubjectById && window.findSubjectById(subjId));
  if (!subj) return;
  
  let unit = { id: unitId, title: `Unit ${unitId}`, topics: [] };
  let dbUnits = [];

  if (window.aimeasyFetchUnits) {
    const { data: fetched } = await window.aimeasyFetchUnits(subjId);
    dbUnits = fetched || [];
    const found = dbUnits.find(u => String(u.id) === String(unitId));
    if (found) unit = found;
  }

  // Load roadmap & content from Supabase to local storage
  if (typeof window.v10ReloadUnitRoadmapFromDb === 'function') {
    const dbUnitObj = { id: unitId, name: unit.title || unit.name, dbUnitId: unit.id };
    const reloadedUnit = await window.v10ReloadUnitRoadmapFromDb(subjId, unitId, { ...subj, dbSubjectId: subjId }, dbUnitObj);
    if (reloadedUnit) {
      unit.topics = reloadedUnit.topics || [];
    }
  }
  if (typeof window.v10ReloadUnitContentFromDb === 'function') {
    await window.v10ReloadUnitContentFromDb(subj.name, unitId);
  }

  const unitNumber = unit.sort_order || dbUnits.findIndex(u => String(u.id) === String(unitId)) + 1 || 1;
  const content = document.getElementById('sa-content');
  if (!content) return;
  
  let roadmapPanelHTML = '';
  if (typeof window.v10RoadmapPanel === 'function') {
    roadmapPanelHTML = window.v10RoadmapPanel(subjId, unitId, unit.topics || []);
  } else {
    roadmapPanelHTML = `<div class="v10-panel"><div class="v10-panel-head"><h4>Roadmap</h4></div><div class="v10-panel-body">No roadmap builder found</div></div>`;
  }

  let dynamicContentPanelHTML = '';
  if (typeof window.v10DynamicContentPanel === 'function') {
    dynamicContentPanelHTML = window.v10DynamicContentPanel(subj.name, unitId, 'subadmin');
  } else {
    dynamicContentPanelHTML = `<div class="v10-panel">No content panel found</div>`;
  }

  content.innerHTML = `<div style="padding:2rem;max-width:1200px;margin:0 auto;width:100%;">
    <button class="back-btn" onclick="window.v10SAUnitsPage(window._v10SASubj)">Back to Units</button>
    <div style="margin:1rem 0 .3rem;">
      <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:4px;">Unit - ${v10Esc(unitNumber)}</h2>
      <p style="font-size:.78rem;color:var(--text3);">${v10Esc(unit.description || 'Build the learning roadmap and add content for this unit.')}</p>
    </div>
    <div class="v10-detail-wrap">${roadmapPanelHTML}${dynamicContentPanelHTML}</div>
  </div>`;
}

export async function v10SAAddUnit(subjId) {
  document.querySelectorAll('.v10-add-unit-modal').forEach(m => m.remove());
  
  if (!window.aimeasyFetchUnits || !window.aimeasyCreateUnit) {
    showToast('Supabase not ready', 'red');
    return;
  }
  const { data: existingUnits } = await window.aimeasyFetchUnits(subjId);
  const currentCount = (existingUnits || []).length;
  const newSortOrder = currentCount + 1;

  const modalHtml = `
    <div class="v10-popup v10-add-unit-modal" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:var(--surface); padding:2rem; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.5); z-index:9999; min-width:300px;">
      <h3 style="margin-bottom:1rem;">Add New Unit</h3>
      <div class="input-group">
        <label>Unit Number / Sort Order</label>
        <input type="number" id="v10-add-unit-order" class="input" value="${newSortOrder}" />
      </div>
      <div class="input-group">
        <label>Unit Title</label>
        <input type="text" id="v10-add-unit-title" class="input" placeholder="e.g. Introduction to Machine Learning" />
      </div>
      <div style="display:flex; gap:10px; margin-top:1.5rem;">
        <button class="btn btn-primary" onclick="window.submitSAAddUnit('${subjId}')" style="flex:1;">Save Unit</button>
        <button class="btn btn-ghost" onclick="this.closest('.v10-add-unit-modal').remove()">Cancel</button>
      </div>
    </div>
    <div class="v10-add-unit-overlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9998;" onclick="this.previousElementSibling.remove(); this.remove();"></div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

export async function submitSAAddUnit(subjId) {
  const orderInput = document.getElementById('v10-add-unit-order');
  const titleInput = document.getElementById('v10-add-unit-title');
  if (!orderInput || !titleInput) return;
  
  const sort_order = parseInt(orderInput.value) || 1;
  const name = titleInput.value.trim();
  if (!name) {
    showToast('Unit title is required', 'red');
    return;
  }

  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Saving...';

  showToast('Creating unit...', 'blue');
  const { data, error } = await window.aimeasyCreateUnit(subjId, {
    name: name,
    title: name,
    sort_order: sort_order
  });
  
  if (error) { 
    showToast('Failed to create unit: ' + error.message, 'red'); 
    btn.disabled = false;
    btn.textContent = 'Save Unit';
    return; 
  }
  
  showToast('✅ Unit added successfully!', 'green');
  document.querySelectorAll('.v10-add-unit-modal, .v10-add-unit-overlay').forEach(el => el.remove());
  await window.v10SAUnitsPage(window._v10SASubj);
}

export async function v10SAEditUnit(subjId, unitId) {
  if (!window.aimeasyUpdateUnit) { showToast('Supabase not ready', 'red'); return; }
  const { data: units } = await window.aimeasyFetchUnits(subjId);
  const unit = (units || []).find(u => String(u.id) === String(unitId));
  if (!unit) { showToast('Unit not found', 'red'); return; }

  const name = prompt('Unit name:', unit.title || unit.name);
  if (!name) return;

  showToast('Saving...', 'blue');
  const { error } = await window.aimeasyUpdateUnit(unitId, { name: name.trim(), title: name.trim() });
  if (error) { showToast('Update failed: ' + error.message, 'red'); return; }
  showToast('✅ Unit updated!', 'green');
  await window.v10SAUnitsPage(window._v10SASubj);
}

export async function v10SADeleteUnit(subjId, unitId) {
  if (!confirm('Delete this unit and all its content from the database?')) return;
  if (!window.aimeasyDeleteUnit) { showToast('Supabase not ready', 'red'); return; }

  showToast('Deleting from Supabase...', 'blue');
  const { error } = await window.aimeasyDeleteUnit(unitId);
  if (error) { showToast('Delete failed: ' + error.message, 'red'); return; }
  showToast('Unit deleted from database', 'red');
  await window.v10SAUnitsPage(window._v10SASubj);
}

export function v10SaDotMenu(btn, id, name) {
  document.querySelectorAll('.v10-popup').forEach(p => p.remove());
  const safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const popup = document.createElement('div');
  popup.className = 'v10-popup';
  popup.innerHTML = `
    <button class="v10-popup-item" onclick="window.v10SAOpenUnits('${id}')">🔍 Open & Manage</button>
    <button class="v10-popup-item" onclick="window.v10SAEditSubject('${id}')">✏️ Edit Subject</button>
    <button class="v10-popup-item red" onclick="window.v10SADeleteSubject('${id}','${safeName}')">🗑 Delete Subject</button>`;
  btn.closest('.v10-dot-wrap').appendChild(popup);
}

export async function v10SAEditSubject(id) {
  document.querySelectorAll('.v10-popup').forEach(p => p.remove());
  if (!window.aimeasyFetchSubjects) { showToast('Supabase not ready', 'red'); return; }

  const { data: allSubjects, error: fetchErr } = await window.aimeasyFetchSubjects({});
  if (fetchErr) { showToast('Could not load subject: ' + fetchErr.message, 'red'); return; }
  const s = (allSubjects || []).find(x => String(x.id) === String(id));
  if (!s) { showToast('Subject not found in database', 'red'); return; }

  const newName = prompt('Subject name:', s.name);
  if (!newName) return;
  const newSem = prompt('Semester (e.g. 3-1):', s.semester);
  const newReg = prompt('Regulation (e.g. R23):', s.regulation_code);

  showToast('Saving changes...', 'blue');
  const { error: updateErr } = await window.aimeasyUpdateSubject(id, {
    name: newName.trim(),
    university_name: s.university_name,
    regulation_code: newReg ? newReg.trim() : s.regulation_code,
    branch: s.branch,
    semester: newSem ? newSem.trim() : s.semester,
    code: s.code,
    credits: s.credits
  });
  if (updateErr) { showToast('Update failed: ' + updateErr.message, 'red'); return; }
  showToast('✅ Subject updated in database!', 'green');
  window.v10SASubjects();
}

export async function v10SADeleteSubject(id, name) {
  document.querySelectorAll('.v10-popup').forEach(p => p.remove());
  if (!confirm(`Delete "${name}" from the database?\n\nThis will permanently remove all content for this subject.`)) return;
  if (!window.aimeasyDeleteSubject) { showToast('Supabase not ready', 'red'); return; }

  showToast('Deleting from database...', 'blue');
  const { error } = await window.aimeasyDeleteSubject(id);
  if (error) { showToast('Delete failed: ' + error.message, 'red'); return; }
  showToast('Subject deleted from database', 'red');
  window.v10SASubjects();
}

export function v10SaViewDotMenu(btn, id, name, isOwned) {
  document.querySelectorAll('.v10-popup').forEach(p => p.remove());
  const safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const popup = document.createElement('div');
  popup.className = 'v10-popup';
  if (isOwned) {
    popup.innerHTML = `
      <button class="v10-popup-item" onclick="window.v10SAOpenUnits('${id}')">🔍 Open & Manage</button>
      <button class="v10-popup-item" onclick="window.v10SAEditSubject('${id}')">✏️ Edit Subject</button>
      <button class="v10-popup-item red" onclick="window.v10SADeleteSubject('${id}','${safeName}')">🗑 Delete Subject</button>`;
  } else {
    popup.innerHTML = `
      <button class="v10-popup-item" onclick="window.v10SAOpenUnits('${id}')">🔍 View Units</button>`;
  }
  btn.closest('.v10-dot-wrap').appendChild(popup);
}

export async function v10SAViewSubjects() {
  const content = document.getElementById('sa-content');
  if (!content) return;

  const sa = getSA();
  
  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;text-align:center;">
    <div class="loading-spinner" style="margin: 3rem auto 1rem;"></div>
    <p style="color:var(--text3);">Fetching subjects in your branch from Supabase...</p>
  </div>`;

  let mySubs = [];
  if (window.aimeasyFetchSubjects) {
    const filters = sa.branch ? { branch: sa.branch } : {};
    const { data, error } = await window.aimeasyFetchSubjects(filters);
    if (error) {
      content.innerHTML = `
      <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;text-align:center;">
        <p style="color:var(--red);">Failed to load subjects: ${error.message}</p>
        <button class="btn btn-primary btn-sm" style="margin-top:1rem;" onclick="window.v10SAViewSubjects()">Retry</button>
      </div>`;
      return;
    }
    mySubs = data || [];
  }

  const cards = mySubs.map(s => {
    const safeName = (s.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const safeId = s.id;
    const isOwned = s.created_by === sa.username;
    return `
    <div class="v10-subj-card" onclick="window.v10SAOpenUnits('${safeId}')">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;">
        <div class="v10-subj-icon">📖</div>
        <div class="v10-dot-wrap" onclick="event.stopPropagation()">
          <button class="v10-dot-btn" onclick="window.v10SaViewDotMenu(this,'${safeId}','${safeName}', ${isOwned})">⋯</button>
        </div>
      </div>
      <div class="v10-subj-name">${v10Esc(s.name)}</div>
      <div class="v10-subj-meta">${v10Esc(s.code || '—')} · ${v10Esc(s.credits || 3)} Cr · ${v10Esc(s.branch || 'CSE')}</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px;">
        <span class="badge badge-primary">${v10Esc(s.semester || '—')}</span>
        <span class="badge badge-teal">${v10Esc(s.university_name || 'JNTUK')}</span>
        <span class="badge badge-lavender">${v10Esc(s.regulation_code || 'R23')}</span>
        <span class="badge badge-amber">${isOwned ? 'Owner' : 'View Only'}</span>
      </div>
      <div class="v10-arrow">${isOwned ? '📋 Click to manage units →' : '🔍 Click to view units →'}</div>
    </div>`;
  }).join('');

  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;flex-wrap:wrap;gap:10px;">
      <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-.02em;">👁️ View Subjects (${mySubs.length})</h2>
      <button class="btn btn-ghost btn-sm" onclick="window.v10SAViewSubjects()">🔄 Refresh</button>
    </div>
    ${mySubs.length
      ? `<div class="v10-subj-grid">${cards}</div>`
      : `<div style="text-align:center;padding:4rem;color:var(--text3);">
          <div style="font-size:3rem;margin-bottom:1rem;">📚</div>
          <div style="font-weight:600;font-size:1rem;margin-bottom:6px;">No subjects found</div>
          <div style="font-size:.82rem;">No subjects are active in this branch yet.</div>
        </div>`}
  </div>`;
}
