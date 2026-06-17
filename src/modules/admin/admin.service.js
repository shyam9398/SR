import appState from '../../core/appState.js';
import { showToast, v11Confirm, v10Esc } from '../../utils/helpers.js';

// Sync subjects from Supabase to localStorage
export async function v11SyncCustomSubjectsFromDb() {
  if (!window.aimeasyFetchSubjects) return;
  const { data, error } = await window.aimeasyFetchSubjects();
  if (error) {
    console.warn('Sync subjects failed:', error);
    return;
  }
  const mapped = (data || []).map(s => ({
    id: s.id,
    name: s.name,
    code: s.code || '',
    branch: s.branch || '',
    year: s.year || '',
    sem: s.semester || s.sem || '',
    reg: s.regulation_code || s.reg || '',
    uni: s.university_name || s.uni || '',
    credits: s.credits || 3,
    createdBy: s.created_by || 'admin'
  }));
  localStorage.setItem('edusync_custom_subjects', JSON.stringify(mapped));
}

export function v11AdminSubjectsPage() {
  const content = document.getElementById('admin-content');
  if (!content) return;
  const custom = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');

  const semGroups = {};
  custom.forEach(s => {
    const key = s.sem || 'Other';
    if (!semGroups[key]) semGroups[key] = [];
    semGroups[key].push(s);
  });

  content.innerHTML = `
  <div style="padding:2rem;max-width:1200px;margin:0 auto;width:100%;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:10px;">
      <div>
        <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-.02em;margin-bottom:4px;">📚 All Subjects</h2>
        <p style="font-size:.83rem;color:var(--text2);">${custom.length} custom subjects · Hover a card and click ⋮ to edit or delete</p>
      </div>
      <button class="btn btn-primary" onclick="window.v11AdminShowCreateSubjectForm()">+ Add Subject</button>
    </div>

    <!-- Create form (collapsed by default) -->
    <div id="v11-adm-create-form" style="display:none;margin-bottom:1.5rem;">
      <div class="card" style="border:2px dashed var(--primary-mid);">
        <h3 style="margin-bottom:1rem;font-size:1rem;">➕ Create New Subject</h3>
        <div class="form-row">
          <div class="input-group"><label>Branch</label>
            <select class="select" id="v11-adm-branch">
              <option value="">Select Branch</option>
              ${['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'AIDS', 'MECH', 'CIVIL'].map(b => `<option>${b}</option>`).join('')}
            </select></div>
          <div class="input-group"><label>Year</label>
            <select class="select" id="v11-adm-year">
              <option value="">Select Year</option>
              ${['1', '2', '3', '4'].map(y => `<option value="${y}">${y}st Year</option>`).join('')}
            </select></div>
        </div>
        <div class="form-row">
          <div class="input-group"><label>Semester</label>
            <select class="select" id="v11-adm-sem">
              <option value="">Select Semester</option>
              ${['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'].map(s => `<option>${s}</option>`).join('')}
            </select></div>
          <div class="input-group"><label>Regulation</label>
            <select class="select" id="v11-adm-reg">
              <option value="">Regulation</option>
              <option>R23</option><option>R20</option><option>R19</option><option>R16</option>
            </select></div>
        </div>
        <div class="form-row">
          <div class="input-group"><label>University</label>
            <select class="select" id="v11-adm-uni">
              <option value="">Select University</option>
              <option>JNTUK</option><option>JNTUH</option><option>Andhra University</option>
            </select></div>
          <div class="input-group"><label>Credits</label>
            <select class="select" id="v11-adm-credits">
              ${[2, 3, 4, 5].map(c => `<option value="${c}">${c} Credits</option>`).join('')}
            </select></div>
        </div>
        <div class="form-row">
          <div class="input-group"><label>Subject Name *</label>
            <input class="input" id="v11-adm-subname" placeholder="e.g. Data Structures"></div>
          <div class="input-group"><label>Code</label>
            <input class="input" id="v11-adm-subcode" placeholder="CS301"></div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-primary" onclick="window.v11AdminCreateSubject()">✅ Create Subject</button>
          <button class="btn btn-ghost" onclick="document.getElementById('v11-adm-create-form').style.display='none'">Cancel</button>
        </div>
      </div>
    </div>

    ${custom.length === 0 ? `
    <div style="text-align:center;padding:4rem;color:var(--text3);">
      <div style="font-size:4rem;margin-bottom:1rem;">📚</div>
      <div style="font-weight:700;font-size:1.05rem;margin-bottom:4px;">No subjects yet</div>
      <div style="font-size:.83rem;">Click "+ Add Subject" to create your first subject</div>
    </div>` : `
    <div class="adm-subj-grid" id="v11-adm-subj-grid">
      ${custom.map(s => window.v11AdminSubjectCard(s)).join('')}
    </div>`}
  </div>`;
}

export function v11AdminSubjectCard(s) {
  const safeName = (s.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `
  <div class="adm-subj-card" id="adm-scard-${s.id}">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
      <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--primary-light),var(--lavender-light));display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;">📖</div>
      <div class="v10-dot-wrap" onclick="event.stopPropagation()">
        <button class="v10-dot-btn" onclick="window.v11AdminSubjectDotMenu(this,'${s.id}','${safeName}')" title="Options">⋮</button>
      </div>
    </div>
    <div style="font-weight:700;font-size:.94rem;margin-bottom:3px;">${v10Esc(s.name)}</div>
    <div style="font-size:.74rem;color:var(--text3);margin-bottom:10px;">${v10Esc(s.code || '—')} · ${v10Esc(s.credits || 3)} Cr · ${v10Esc(s.branch || 'CSE')}</div>
    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;">
      <span class="badge badge-primary">${v10Esc(s.sem || '—')}</span>
      <span class="badge badge-teal">${v10Esc(s.uni || 'JNTUK')}</span>
      <span class="badge badge-lavender">${v10Esc(s.reg || 'R23')}</span>
    </div>
    <button class="btn btn-ghost btn-sm" onclick="window.v11AdminOpenSubject('${s.id}')" style="width:100%;">📂 Manage Units & Content →</button>
  </div>`;
}

export function v11AdminShowCreateSubjectForm() {
  const form = document.getElementById('v11-adm-create-form');
  if (form) form.style.display = 'block';
}

export function v11AdminSubjectDotMenu(btn, id, safeName) {
  if (typeof window.v11CloseAllPopups === 'function') {
    window.v11CloseAllPopups();
  }
  const popup = document.createElement('div');
  popup.className = 'adm-popup';
  popup.style.cssText = 'position:absolute;right:0;top:100%;z-index:99;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);box-shadow:var(--shadow-md);display:flex;flex-direction:column;min-width:120px;';
  popup.innerHTML = `
    <button class="adm-popup-item" onclick="window.v11AdminOpenSubject('${id}')">📂 Manage Units</button>
    <button class="adm-popup-item" onclick="window.v11AdminEditSubject('${id}')">✏️ Edit Subject</button>
    <button class="adm-popup-item red" onclick="window.v11AdminDeleteSubject('${id}','${safeName}')">🗑️ Delete Subject</button>`;
  btn.closest('.v10-dot-wrap').appendChild(popup);
  event.stopPropagation();
}

export async function v11AdminCreateSubject() {
  const branch = document.getElementById('v11-adm-branch')?.value;
  const year = document.getElementById('v11-adm-year')?.value;
  const sem = document.getElementById('v11-adm-sem')?.value;
  const reg = document.getElementById('v11-adm-reg')?.value;
  const uni = document.getElementById('v11-adm-uni')?.value;
  const credits = document.getElementById('v11-adm-credits')?.value || '3';
  const name = document.getElementById('v11-adm-subname')?.value.trim();
  const code = document.getElementById('v11-adm-subcode')?.value.trim();
  if (!branch || !sem || !reg || !uni || !name) { showToast('Fill all required fields', 'red'); return; }
  
  if (window.aimeasyCreateSubject) {
    const { error } = await window.aimeasyCreateSubject({
      branch,
      year,
      sem,
      reg,
      uni,
      credits,
      name,
      code,
      createdBy: 'admin'
    });
    if (error) {
      showToast('Create subject failed: ' + error.message, 'red');
      return;
    }
  }
  showToast('✅ Subject created! Visible everywhere.', 'green');
  window._adminSubjectsSynced = false;
  await v11SyncCustomSubjectsFromDb();
  v11AdminSubjectsPage();
}

export async function v11AdminEditSubject(id) {
  if (typeof window.v11CloseAllPopups === 'function') {
    window.v11CloseAllPopups();
  }
  if (!window.aimeasyFetchSubjects) { showToast('Supabase not ready', 'red'); return; }
  const { data: allSubjects, error: fetchErr } = await window.aimeasyFetchSubjects({});
  if (fetchErr) { showToast('Could not load subject: ' + fetchErr.message, 'red'); return; }
  const s = (allSubjects || []).find(x => String(x.id) === String(id));
  if (!s) { showToast('Subject not found in database', 'red'); return; }

  const newName = prompt('Subject name:', s.name);
  if (!newName) return;
  const newSem = prompt('Semester (e.g. 3-1):', s.semester || s.sem);
  const newReg = prompt('Regulation (e.g. R23):', s.regulation_code || s.reg);

  showToast('Saving changes...', 'blue');
  const { error } = await window.aimeasyUpdateSubject(id, {
    name: newName.trim(),
    code: s.code,
    branch: s.branch,
    semester: newSem ? newSem.trim() : s.semester,
    regulation_code: newReg ? newReg.trim() : s.regulation_code,
    university_name: s.university_name,
    year: s.year,
    credits: s.credits
  });
  if (error) {
    showToast('Edit subject failed: ' + error.message, 'red');
    return;
  }
  showToast('✅ Subject updated! Changes reflected everywhere.', 'green');
  window._adminSubjectsSynced = false;
  await v11SyncCustomSubjectsFromDb();
  v11AdminSubjectsPage();
}

export function v11AdminDeleteSubject(id, name) {
  if (typeof window.v11CloseAllPopups === 'function') {
    window.v11CloseAllPopups();
  }
  v11Confirm(
    `Delete subject "<strong>${name}</strong>"?<br><br>This will permanently remove all its units, topics, videos, notes, PYQs, and important questions.`,
    async () => {
      if (window.aimeasyDeleteSubject) {
        const { error } = await window.aimeasyDeleteSubject(id);
        if (error) {
          showToast('Delete subject failed: ' + error.message, 'red');
          return;
        }
      }
      localStorage.removeItem('edusync_units_' + id);
      ['edusync_admin_notes', 'edusync_admin_pyqs', 'edusync_admin_iqs', 'edusync_admin_videos'].forEach(key => {
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify(arr.filter(x => x.subject !== name)));
      });
      showToast('Subject and all related content deleted.', 'red');
      window._adminSubjectsSynced = false;
      await v11SyncCustomSubjectsFromDb();
      v11AdminSubjectsPage();
    }
  );
}

export function v11AdminOpenSubject(id) {
  const custom = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const subj = custom.find(s => String(s.id) === String(id));
  if (!subj) return;
  window._v11AdminSubj = subj;
  v11AdminUnitsPage(subj);
}

export async function v11AdminUnitsPage(subj) {
  const content = document.getElementById('admin-content');
  if (!content) return;
  
  let uList = [];
  if (window.aimeasyFetchUnits) {
    const { data: dbUnits } = await window.aimeasyFetchUnits(subj.id);
    uList = dbUnits || [];
  }

  const adminVideos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
  const adminNotes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  const adminPYQs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  const adminIQs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');

  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
    <button class="v11-back" onclick="window.v11AdminSubjectsPage()">← Back to Subjects</button>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:10px;">
      <div>
        <h2 style="font-size:1.2rem;font-weight:800;letter-spacing:-.02em;margin-bottom:4px;">📖 ${v10Esc(subj.name)} — Units</h2>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <span class="badge badge-primary">${v10Esc(subj.sem || '—')}</span>
          <span class="badge badge-teal">${v10Esc(subj.uni || 'JNTUK')}</span>
          <span class="badge badge-lavender">${v10Esc(subj.reg || 'R23')}</span>
          <span class="badge badge-amber">${v10Esc(subj.branch || 'CSE')}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="window.v11AdminAddUnit('${subj.id}')">+ Add Unit</button>
    </div>
    <div class="adm-unit-grid">
      ${uList.map((u, ui) => {
        const vC = adminVideos.filter(v => v.subject === subj.name && String(v.unit) === String(u.id)).length;
        const nC = adminNotes.filter(n => n.subject === subj.name && String(n.unit) === String(u.id)).length;
        const pC = adminPYQs.filter(p => p.subject === subj.name && String(p.unit) === String(u.id)).length;
        const iC = adminIQs.filter(q => q.subject === subj.name && String(q.unit) === String(u.id)).length;
        const tC = (u.topics || []).length;
        const unitLabelStr = u.title || u.name || `Unit ${ui + 1}`;
        return `<div class="adm-unit-card">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
            <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--lavender),var(--primary));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:1.1rem;flex-shrink:0;">${u.sort_order || u.id}</div>
            <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
              <button class="v10-dot-btn" title="Edit" onclick="window.v11AdminEditUnit('${subj.id}',${ui})" style="font-size:.8rem;">✏️</button>
              <button class="v10-dot-btn" title="Delete" onclick="window.v11AdminDeleteUnit('${subj.id}',${ui})" style="font-size:.8rem;color:var(--red);">🗑️</button>
            </div>
          </div>
          <div style="font-weight:700;font-size:.9rem;margin-bottom:4px;">${v10Esc(unitLabelStr)}</div>
          <div style="font-size:.74rem;color:var(--text3);margin-bottom:8px;">${tC} topic${tC !== 1 ? 's' : ''}</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;">
            ${vC ? `<span class="badge badge-teal">🎬 ${vC}</span>` : ''}
            ${nC ? `<span class="badge badge-primary">📄 ${nC}</span>` : ''}
            ${pC ? `<span class="badge badge-amber">📝 ${pC}</span>` : ''}
            ${iC ? `<span class="badge badge-lavender">⭐ ${iC}</span>` : ''}
          </div>
          <button class="btn btn-ghost btn-sm" onclick="window.v11AdminUnitDetail('${subj.id}','${u.id}')" style="width:100%;">Manage Content →</button>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

export async function v11AdminAddUnit(subjId) {
  if (!window.aimeasyCreateUnit || !window.aimeasyFetchUnits) {
    showToast('Supabase not ready', 'red');
    return;
  }
  const { data: existingUnits } = await window.aimeasyFetchUnits(subjId);
  const currentCount = (existingUnits || []).length;
  const newSortOrder = currentCount + 1;
  const name = prompt('Unit name / title:', `Unit ${newSortOrder}`);
  if (!name) return;

  const { error } = await window.aimeasyCreateUnit(subjId, {
    name: name.trim(),
    title: name.trim(),
    sort_order: newSortOrder
  });
  if (error) { showToast('Add unit failed: ' + error.message, 'red'); return; }
  showToast('✅ Unit added!', 'green');
  v11AdminUnitsPage(window._v11AdminSubj);
}

export async function v11AdminEditUnit(subjId, idx) {
  if (!window.aimeasyUpdateUnit || !window.aimeasyFetchUnits) {
    showToast('Supabase not ready', 'red');
    return;
  }
  const { data: dbUnits } = await window.aimeasyFetchUnits(subjId);
  const unit = (dbUnits || [])[idx];
  if (!unit) return;
  const name = prompt('Unit name:', unit.title || unit.name);
  if (!name) return;

  const { error } = await window.aimeasyUpdateUnit(unit.id, { name: name.trim(), title: name.trim() });
  if (error) { showToast('Edit unit failed: ' + error.message, 'red'); return; }
  showToast('✅ Unit updated!', 'green');
  v11AdminUnitsPage(window._v11AdminSubj);
}

export async function v11AdminDeleteUnit(subjId, idx) {
  if (!confirm('Are you sure you want to delete this unit and all its contents?')) return;
  if (!window.aimeasyDeleteUnit || !window.aimeasyFetchUnits) {
    showToast('Supabase not ready', 'red');
    return;
  }
  const { data: dbUnits } = await window.aimeasyFetchUnits(subjId);
  const unit = (dbUnits || [])[idx];
  if (!unit) return;

  const { error } = await window.aimeasyDeleteUnit(unit.id);
  if (error) { showToast('Delete unit failed: ' + error.message, 'red'); return; }
  showToast('Unit deleted', 'red');
  v11AdminUnitsPage(window._v11AdminSubj);
}

export async function v11AdminUnitDetail(subjId, unitId) {
  window._v11AdminSubjId = subjId;
  window._v11AdminUnitId = unitId;
  const subj = window._v11AdminSubj;
  if (!subj) return;

  let unit = { id: unitId, name: `Unit ${unitId}`, topics: [] };
  let dbUnits = [];
  if (window.aimeasyFetchUnits) {
    const { data: fetched } = await window.aimeasyFetchUnits(subjId);
    dbUnits = fetched || [];
    const found = dbUnits.find(u => String(u.id) === String(unitId));
    if (found) unit = { ...found, name: found.title || found.name };
  }

  // Reload unit details from db
  if (typeof window.v10ReloadUnitRoadmapFromDb === 'function') {
    const dbUnitObj = { id: unitId, name: unit.name, dbUnitId: unit.id };
    const reloadedUnit = await window.v10ReloadUnitRoadmapFromDb(subjId, unitId, { ...subj, dbSubjectId: subjId }, dbUnitObj);
    if (reloadedUnit) {
      unit.topics = reloadedUnit.topics || [];
    }
  }
  if (typeof window.v10ReloadUnitContentFromDb === 'function') {
    await window.v10ReloadUnitContentFromDb(subj.name, unitId);
  }

  const adminVideos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]').filter(v => v.subject === subj.name && String(v.unit) === String(unitId));
  const adminNotes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => n.subject === subj.name && String(n.unit) === String(unitId));
  const adminPYQs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => p.subject === subj.name && String(p.unit) === String(unitId));
  const adminIQs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => q.subject === subj.name && String(q.unit) === String(unitId));

  const content = document.getElementById('admin-content');
  if (!content) return;

  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
    <button class="v11-back" onclick="window.v11AdminUnitsPage(window._v11AdminSubj)">← Back to Units</button>
    <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:.4rem;">${v10Esc(subj.name)} — ${v10Esc(unit.name)}</h2>
    <p style="font-size:.79rem;color:var(--text3);margin-bottom:1.2rem;">Full content management for this unit</p>

    <!-- Content Tabs -->
    <div class="v11-tabs">
      <button class="v11-tab on" onclick="window.v11SwitchTab(this,'v11-topics')">📋 Topics (${(unit.topics || []).length})</button>
      <button class="v11-tab" onclick="window.v11SwitchTab(this,'v11-videos')">🎬 Videos (${adminVideos.length})</button>
      <button class="v11-tab" onclick="window.v11SwitchTab(this,'v11-notes')">📄 Notes (${adminNotes.length})</button>
      <button class="v11-tab" onclick="window.v11SwitchTab(this,'v11-pyqs')">📝 PYQs (${adminPYQs.length})</button>
      <button class="v11-tab" onclick="window.v11SwitchTab(this,'v11-iqs')">⭐ Imp. Questions (${adminIQs.length})</button>
    </div>

    <!-- Topics pane -->
    <div class="v11-pane on" id="v11-topics">
      <div class="card">
        <h4 style="margin-bottom:1rem;">Learning Roadmap / Topics</h4>
        <div id="v11-topics-list">
          ${(unit.topics || []).map((t, ti) => `
          <div class="v11-item-row">
            <span style="width:22px;height:22px;border-radius:50%;background:var(--primary);color:#fff;font-size:.7rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${ti + 1}</span>
            <span style="flex:1;">${v10Esc(t.name)}</span>
            ${t.url ? `<a href="${t.url}" target="_blank" class="badge badge-teal" style="text-decoration:none;">▶ Video</a>` : ''}
            <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeleteTopic('${subjId}','${unitId}',${ti})">✕</button>
          </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No topics yet. Add some below.</p>'}
        </div>
        <hr style="margin:1rem 0;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          <input class="input" id="v11-topic-name" placeholder="Topic name" style="flex:1;min-width:180px;">
          <input class="input" id="v11-topic-url" placeholder="YouTube URL (optional)" style="flex:1;min-width:220px;">
          <button class="btn btn-primary" onclick="window.v11AdminAddTopic('${subjId}','${unitId}')">+ Add Topic</button>
        </div>
      </div>
    </div>

    <!-- Videos pane -->
    <div class="v11-pane" id="v11-videos">
      <div class="card">
        <h4 style="margin-bottom:1rem;">🎬 Upload Video</h4>
        <div class="form-row">
          <div class="input-group"><label>Video Title</label><input class="input" id="v11-vtitle" placeholder="e.g. Unit 1 Introduction"></div>
          <div class="input-group"><label>YouTube URL</label><input class="input" id="v11-vurl" placeholder="https://youtube.com/watch?v=..."></div>
        </div>
        <button class="btn btn-primary" onclick="window.v11AdminUploadVideo('${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">📤 Upload Video</button>
        <hr style="margin:1rem 0;">
        <div id="v11-videos-list">
          ${adminVideos.map(v => `
          <div class="v11-item-row">
            <span>🎬</span>
            <div style="flex:1;min-width:0;"><div style="font-weight:600;">${v10Esc(v.title)}</div><div style="font-size:.72rem;color:var(--primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v10Esc(v.url)}</div></div>
            <span class="badge badge-green">Live</span>
            <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeleteVideo('${v.id}','${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">✕</button>
          </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No videos yet.</p>'}
        </div>
      </div>
    </div>

    <!-- Notes pane -->
    <div class="v11-pane" id="v11-notes">
      <div class="card">
        <h4 style="margin-bottom:1rem;">📄 Upload Notes</h4>
        <div class="form-row">
          <div class="input-group"><label>Title</label><input class="input" id="v11-ntitle" placeholder="e.g. Unit 1 Handwritten Notes"></div>
          <div class="input-group"><label>Type</label>
            <select class="select" id="v11-ntype">
              <option value="pdf">PDF</option><option value="doc">DOC</option><option value="link">Link</option>
            </select></div>
        </div>
        <div class="input-group"><label>Google Drive / URL Link</label><input class="input" id="v11-nlink" placeholder="https://drive.google.com/..."></div>
        <button class="btn btn-primary" onclick="window.v11AdminUploadNote('${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">📤 Upload Notes</button>
        <hr style="margin:1rem 0;">
        <div id="v11-notes-list">
          ${adminNotes.map(n => `
          <div class="v11-item-row">
            <span>${n.type === 'pdf' ? '📄' : '📝'}</span>
            <div style="flex:1;"><div style="font-weight:600;">${v10Esc(n.title)}</div><div style="font-size:.72rem;color:var(--text3);">${v10Esc(n.type?.toUpperCase() || 'FILE')} · ${v10Esc(n.uploadedAt || '')}</div></div>
            <span class="badge badge-green">Live</span>
            <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeleteNote('${n.id}','${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">✕</button>
          </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No notes yet.</p>'}
        </div>
      </div>
    </div>

    <!-- PYQs pane -->
    <div class="v11-pane" id="v11-pyqs">
      <div class="card">
        <h4 style="margin-bottom:1rem;">📝 Add PYQ</h4>
        <div class="form-row">
          <div class="input-group"><label>Exam Year</label><input class="input" id="v11-pyqyr" placeholder="e.g. 2023" type="number" min="2000" max="2099"></div>
          <div class="input-group"><label>Times Asked</label><input class="input" id="v11-pyqcnt" placeholder="e.g. 3" type="number" min="1" value="1"></div>
        </div>
        <div class="input-group"><label>Question</label><textarea class="input" id="v11-pyqtxt" placeholder="Type the question..." rows="3" style="resize:vertical;"></textarea></div>
        <div class="input-group"><label>Answer (optional)</label><textarea class="input" id="v11-pyqans" placeholder="Answer/explanation..." rows="2" style="resize:vertical;"></textarea></div>
        <button class="btn btn-primary" onclick="window.v11AdminUploadPYQ('${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">📝 Add PYQ</button>
        <hr style="margin:1rem 0;">
        <div id="v11-pyqs-list">
          ${adminPYQs.map(p => `
          <div class="v11-item-row">
            <span>📅</span>
            <div style="flex:1;min-width:0;"><div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v10Esc(p.question.substring(0, 80))}${p.question.length > 80 ? '...' : ''}</div><div style="font-size:.72rem;color:var(--text3);">Year: ${v10Esc(p.year)} · ×${v10Esc(p.count || 1)}</div></div>
            <span class="badge badge-green">Live</span>
            <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeletePYQ('${p.id}','${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">✕</button>
          </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No PYQs yet.</p>'}
        </div>
      </div>
    </div>

    <!-- Important Questions pane -->
    <div class="v11-pane" id="v11-iqs">
      <div class="card">
        <h4 style="margin-bottom:1rem;">⭐ Add Important Question</h4>
        <div class="input-group"><label>Question</label><textarea class="input" id="v11-iqtxt" placeholder="Type the important question..." rows="3" style="resize:vertical;"></textarea></div>
        <div class="form-row">
          <div class="input-group"><label>Priority</label>
            <select class="select" id="v11-iqprio">
              <option value="high">🔴 High</option>
              <option value="med" selected>🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select></div>
          <div class="input-group"><label>Tags</label><input class="input" id="v11-iqtags" placeholder="e.g. Unit 1, Memory"></div>
        </div>
        <button class="btn btn-primary" onclick="window.v11AdminUploadIQ('${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">⭐ Add Question</button>
        <hr style="margin:1rem 0;">
        <div id="v11-iqs-list">
          ${adminIQs.map(q => `
          <div class="v11-item-row">
            <span>${q.priority === 'high' ? '🔴' : q.priority === 'low' ? '🟢' : '🟡'}</span>
            <div style="flex:1;min-width:0;"><div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v10Esc(q.question.substring(0, 80))}${q.question.length > 80 ? '...' : ''}</div><div style="font-size:.72rem;color:var(--text3);">${v10Esc(q.priority)} priority${q.tags ? ' · ' + v10Esc(q.tags) : ''}</div></div>
            <span class="badge badge-green">Live</span>
            <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeleteIQ('${q.id}','${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">✕</button>
          </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No important questions yet.</p>'}
        </div>
      </div>
    </div>
  </div>`;
}

export function v11SwitchTab(btn, paneId) {
  const allTabs = btn.closest('.v11-tabs');
  if (!allTabs) return;
  allTabs.querySelectorAll('.v11-tab').forEach(t => t.classList.remove('on'));
  btn.classList.add('on');
  
  const parent = allTabs.parentElement;
  if (!parent) return;
  parent.querySelectorAll('.v11-pane').forEach(p => p.classList.remove('on'));
  const target = document.getElementById(paneId);
  if (target) target.classList.add('on');
}

export async function v11AdminAddTopic(subjId, unitId) {
  const nameEl = document.getElementById('v11-topic-name');
  const urlEl = document.getElementById('v11-topic-url');
  const name = nameEl?.value.trim();
  const url = urlEl?.value.trim();
  if (!name) { showToast('Enter topic name', 'red'); return; }
  if (!url) { showToast('Enter topic URL', 'red'); return; }
  try { new URL(url); } catch (e) { showToast('Please enter a valid URL', 'red'); return; }

  const subj = window._v11AdminSubj || window._v10SASubj || (window.findSubjectById && window.findSubjectById(subjId));
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  const unit = units.find(u => String(u.id) === String(unitId)) || { id: unitId, name: `Unit ${unitId}` };
  if (!window.aimeasySaveUnitRoadmap || !subj) {
    showToast('Topic DB save is unavailable.', 'red');
    return;
  }

  await window.v10ReloadUnitRoadmapFromDb?.(subjId, unitId, { ...subj, dbSubjectId: subjId }, { ...unit, dbUnitId: unit.id });
  const latestUnits = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  const latestUnit = latestUnits.find(u => String(u.id) === String(unitId)) || unit;
  const topics = [...(latestUnit.topics || []), {
    name,
    topicName: name,
    url,
    youtubeUrl: url,
    urls: [url],
    youtubeUrls: [url],
    videos: [{ url, description: '' }],
  }];

  const { data, error } = await window.aimeasySaveUnitRoadmap({ subject: subj, unit, topics });
  if (error) {
    showToast('Topic save failed: ' + error.message, 'red');
    return;
  }
  if (nameEl) nameEl.value = '';
  if (urlEl) urlEl.value = '';
  await window.v10ReloadUnitRoadmapFromDb?.(subjId, unitId, { ...subj, dbSubjectId: data.subjectId }, { ...unit, dbUnitId: data.unitId });
  showToast('Topic saved.', 'green');
  v11AdminUnitDetail(subjId, unitId);
}

export async function v11AdminDeleteTopic(subjId, unitId, topicIdx) {
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  const unit = units.find(u => String(u.id) === String(unitId));
  const topic = unit?.topics?.[topicIdx];
  if (!topic?.id) return;
  window.v10DeleteSavedRoadmapTopicDb?.(subjId, unitId, topic.id);
}

export function v11AdminUploadVideo(subjId, unitId, subjName) {
  const title = document.getElementById('v11-vtitle')?.value.trim();
  const url = document.getElementById('v11-vurl')?.value.trim();
  if (!title || !url) { showToast('Enter title and URL', 'red'); return; }
  const videos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
  videos.push({ id: Date.now(), title, url, subject: subjName, unit: unitId, uploadedAt: new Date().toLocaleString(), uploadedBy: 'Admin' });
  localStorage.setItem('edusync_admin_videos', JSON.stringify(videos));
  
  const titleEl = document.getElementById('v11-vtitle');
  if (titleEl) titleEl.value = '';
  const urlEl = document.getElementById('v11-vurl');
  if (urlEl) urlEl.value = '';

  showToast('✅ Video uploaded! Live for students.', 'green');
  v11AdminUnitDetail(subjId, unitId);
}

export function v11AdminDeleteVideo(vid, subjId, unitId, subjName) {
  const videos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
  localStorage.setItem('edusync_admin_videos', JSON.stringify(videos.filter(v => String(v.id) !== String(vid))));
  showToast('Video deleted', 'red');
  v11AdminUnitDetail(subjId, unitId);
}

export function v11AdminUploadNote(subjId, unitId, subjName) {
  const title = document.getElementById('v11-ntitle')?.value.trim();
  const type = document.getElementById('v11-ntype')?.value;
  const link = document.getElementById('v11-nlink')?.value.trim();
  if (!title) { showToast('Enter title', 'red'); return; }
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  notes.push({ id: Date.now(), title, type, link, subject: subjName, unit: unitId, uploadedAt: new Date().toLocaleString(), uploadedBy: 'Admin' });
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes));
  
  const titleEl = document.getElementById('v11-ntitle');
  if (titleEl) titleEl.value = '';
  const linkEl = document.getElementById('v11-nlink');
  if (linkEl) linkEl.value = '';

  showToast('✅ Notes uploaded! Live for students.', 'green');
  v11AdminUnitDetail(subjId, unitId);
}

export function v11AdminDeleteNote(nid, subjId, unitId, subjName) {
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes.filter(n => String(n.id) !== String(nid))));
  showToast('Note deleted', 'red');
  v11AdminUnitDetail(subjId, unitId);
}

export function v11AdminUploadPYQ(subjId, unitId, subjName) {
  const year = document.getElementById('v11-pyqyr')?.value.trim();
  const count = document.getElementById('v11-pyqcnt')?.value || '1';
  const question = document.getElementById('v11-pyqtxt')?.value.trim();
  const answer = document.getElementById('v11-pyqans')?.value.trim();
  if (!question || !year) { showToast('Enter question and year', 'red'); return; }
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  pyqs.push({ id: Date.now(), question, answer, year, count: parseInt(count) || 1, subject: subjName, unit: unitId, uploadedAt: new Date().toLocaleString() });
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs));
  
  const qEl = document.getElementById('v11-pyqtxt');
  if (qEl) qEl.value = '';
  const ansEl = document.getElementById('v11-pyqans');
  if (ansEl) ansEl.value = '';
  const yrEl = document.getElementById('v11-pyqyr');
  if (yrEl) yrEl.value = '';

  showToast('✅ PYQ added! Live for students.', 'green');
  v11AdminUnitDetail(subjId, unitId);
}

export function v11AdminDeletePYQ(pid, subjId, unitId, subjName) {
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs.filter(p => String(p.id) !== String(pid))));
  showToast('PYQ deleted', 'red');
  v11AdminUnitDetail(subjId, unitId);
}

export function v11AdminUploadIQ(subjId, unitId, subjName) {
  const question = document.getElementById('v11-iqtxt')?.value.trim();
  const priority = document.getElementById('v11-iqprio')?.value;
  const tags = document.getElementById('v11-iqtags')?.value.trim();
  if (!question) { showToast('Enter question', 'red'); return; }
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  iqs.push({ id: Date.now(), question, priority, tags, subject: subjName, unit: unitId, uploadedAt: new Date().toLocaleString() });
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs));
  
  const qEl = document.getElementById('v11-iqtxt');
  if (qEl) qEl.value = '';
  const tagsEl = document.getElementById('v11-iqtags');
  if (tagsEl) tagsEl.value = '';

  showToast('✅ Important question added! Live for students.', 'green');
  v11AdminUnitDetail(subjId, unitId);
}

export function v11AdminDeleteIQ(qid, subjId, unitId, subjName) {
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs.filter(q => String(q.id) !== String(qid))));
  showToast('Question deleted', 'red');
  v11AdminUnitDetail(subjId, unitId);
}

export async function v11AdminSaveEditSubject(id) {
  const name = document.getElementById('v11-edit-name')?.value.trim();
  const code = document.getElementById('v11-edit-code')?.value.trim();
  const branch = document.getElementById('v11-edit-branch')?.value;
  const sem = document.getElementById('v11-edit-sem')?.value;
  const reg = document.getElementById('v11-edit-reg')?.value;
  const uni = document.getElementById('v11-edit-uni')?.value;
  const year = document.getElementById('v11-edit-year')?.value;
  const credits = document.getElementById('v11-edit-credits')?.value || '3';

  if (window.aimeasyUpdateSubject) {
    const { error } = await window.aimeasyUpdateSubject(id, {
      name,
      code,
      branch,
      sem,
      reg,
      uni,
      year,
      credits
    });
    if (error) {
      showToast('Edit subject failed: ' + error.message, 'red');
      return;
    }
  }
  showToast('✅ Subject updated! Changes reflected everywhere.', 'green');
  window._adminSubjectsSynced = false;
  await v11SyncCustomSubjectsFromDb();
  v11AdminSubjectsPage();
}
