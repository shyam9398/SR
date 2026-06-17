import appState from '../../core/appState.js';
import { showToast } from '../../utils/helpers.js';

const GRADES = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, F: 0 };
const DEFAULT_SUBJECTS = ['Data Structures', 'Operating Systems', 'DBMS', 'Computer Networks', 'Software Engineering'];

export function loadCalcState() {
  try {
    const saved = localStorage.getItem('edusync_cgpa_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.calcSemesters) && parsed.calcSemesters.length) {
        appState.calcSemesters = parsed.calcSemesters;
        appState.currentSemId = parsed.currentSemId || parsed.calcSemesters[0].id;
        console.log('CGPA loaded', parsed);
        return true;
      }
    }
  } catch (e) {
    console.warn('Failed to load CGPA calculator state:', e);
  }
  return false;
}

export function saveCalcState() {
  try {
    const data = {
      calcSemesters: appState.calcSemesters,
      currentSemId: appState.currentSemId
    };
    localStorage.setItem('edusync_cgpa_data', JSON.stringify(data));
    console.log('Saving CGPA', data);
  } catch (e) {
    console.warn('Failed to save CGPA calculator state:', e);
  }
}

export async function initCalc() {
  if (window.__aiiensHydrationPromise) {
    await window.__aiiensHydrationPromise;
  }
  loadCalcState();

  if (!appState.calcSemesters.length) {
    appState.calcSemesters.push({ id: 'sem-1', label: 'Semester 1', rows: [], sgpa: null });
    appState.currentSemId = 'sem-1';
  }
  renderSemTabs();
  renderCalcSemTitle();
  const tbody = document.getElementById('calc-tbody');
  if (tbody && !tbody.children.length) {
    const sem = appState.calcSemesters.find(s => s.id === appState.currentSemId);
    if (sem && sem.rows && sem.rows.length) {
      sem.rows.forEach(r => addCalcRow(r.name, r.credits, r.grade));
    } else {
      DEFAULT_SUBJECTS.forEach(s => addCalcRow(s));
    }
  }

  // Restore SGPA & CGPA UI displays
  const sem = appState.calcSemesters.find(s => s.id === appState.currentSemId);
  if (sem && sem.sgpa !== null) {
    const sgpaEl = document.getElementById('sgpa-result');
    if (sgpaEl) sgpaEl.textContent = sem.sgpa.toFixed(2);
  } else {
    const sgpaEl = document.getElementById('sgpa-result');
    if (sgpaEl) sgpaEl.textContent = '–';
  }

  const calcdSems = appState.calcSemesters.filter(s => s.sgpa !== null);
  const cgpaEl = document.getElementById('cgpa-result');
  if (cgpaEl) {
    if (calcdSems.length > 0) {
      const cgpa = Math.min(10, calcdSems.reduce((s, x) => s + x.sgpa, 0) / calcdSems.length);
      cgpaEl.textContent = cgpa.toFixed(2);
      const summaryEl = document.getElementById('all-sems-summary');
      const listEl = document.getElementById('all-sems-list');
      if (summaryEl && listEl && calcdSems.length > 1) {
        summaryEl.style.display = 'block';
        listEl.innerHTML = calcdSems.map(s =>
          `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:0.82rem;">
          <span style="font-weight:600;">${s.label}</span>
          <span style="color:var(--primary);font-weight:700;">${s.sgpa.toFixed(2)}</span></div>`
        ).join('') +
          `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:0.88rem;">
          <span style="font-weight:700;">Overall CGPA</span>
          <span style="color:var(--teal);font-weight:800;">${cgpa.toFixed(2)}</span></div>`;
      }
    } else {
      cgpaEl.textContent = '–';
    }
  }
}

export function addSemester() {
  const num = appState.calcSemesters.length + 1;
  const semId = 'sem-' + num;
  saveCurrentSemRows();
  appState.calcSemesters.push({ id: semId, label: 'Semester ' + num, rows: [], sgpa: null });
  appState.currentSemId = semId;
  const tbody = document.getElementById('calc-tbody');
  if (tbody) tbody.innerHTML = '';
  appState.calcRows = [];
  renderSemTabs();
  renderCalcSemTitle();
  saveCalcState();
  showToast('Semester ' + num + ' added!', 'green');
}

export function saveCurrentSemRows() {
  const sem = appState.calcSemesters.find(s => s.id === appState.currentSemId);
  if (!sem) return;
  const rows = [];
  document.querySelectorAll('#calc-tbody tr').forEach(row => {
    const inputs = row.querySelectorAll('input,select');
    rows.push({ name: inputs[0]?.value || '', credits: inputs[1]?.value || '3', grade: inputs[2]?.value || 'A' });
  });
  sem.rows = rows;
  saveCalcState();
}

export function switchSem(semId) {
  saveCurrentSemRows();
  appState.currentSemId = semId;
  const sem = appState.calcSemesters.find(s => s.id === semId);
  const tbody = document.getElementById('calc-tbody');
  if (tbody) tbody.innerHTML = '';
  appState.calcRows = [];
  if (sem && sem.rows.length) {
    sem.rows.forEach(r => addCalcRow(r.name, r.credits, r.grade));
  } else {
    DEFAULT_SUBJECTS.forEach(s => addCalcRow(s));
  }
  renderSemTabs();
  renderCalcSemTitle();
  const sgpaEl = document.getElementById('sgpa-result');
  if (sgpaEl) {
    if (sem && sem.sgpa !== null) {
      sgpaEl.textContent = sem.sgpa.toFixed(2);
    } else {
      sgpaEl.textContent = '–';
    }
  }
  saveCalcState();
}

export function renderSemTabs() {
  const container = document.getElementById('sem-tabs');
  if (!container) return;
  container.innerHTML = appState.calcSemesters.map(function (s) {
    var cls = s.id === appState.currentSemId ? 'btn-primary' : 'btn-ghost';
    var lbl = s.label + (s.sgpa !== null ? ' · ' + s.sgpa.toFixed(2) : '');
    return `<button class="btn ${cls} btn-sm" onclick="window.switchSem('${s.id}')">${lbl}</button>`;
  }).join('');
}

export function renderCalcSemTitle() {
  const sem = appState.calcSemesters.find(s => s.id === appState.currentSemId);
  const el = document.getElementById('calc-sem-title');
  if (el && sem) el.textContent = sem.label + ' Subjects';
}

export function addCalcRow(name, credits, defaultGrade) {
  const id = Date.now() + Math.random();
  appState.calcRows.push(id);
  const tbody = document.getElementById('calc-tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.id = 'row-' + id;
  const selGrade = defaultGrade || 'A';
  const selCredits = credits || '3';
  const gradeOptions = Object.keys(GRADES).map(g =>
    '<option value="' + g + '"' + (g === selGrade ? ' selected' : '') + '>' + g + '</option>'
  ).join('');
  tr.innerHTML =
    '<td class="input-cell"><input type="text" placeholder="Subject name" value="' + (name || '') + '" style="min-width:140px;"></td>' +
    '<td class="input-cell"><input type="number" min="1" max="5" value="' + selCredits + '" style="width:60px;text-align:center;"></td>' +
    '<td class="input-cell"><select style="width:70px;">' + gradeOptions + '</select></td>' +
    '<td style="text-align:center;font-weight:700;" class="pts-cell">' + (GRADES[selGrade] || 0) + '</td>' +
    '<td><button style="background:none;border:none;cursor:pointer;color:var(--red);font-size:1rem;padding:4px;" onclick="window.removeCalcRow(\'' + id + '\')">✕</button></td>';
  tbody.appendChild(tr);
  if (selGrade === 'F') tr.classList.add('fail-row');

  // Real-time updates and saving
  const select = tr.querySelector('select');
  select.addEventListener('change', function () {
    const pts = tr.querySelector('.pts-cell');
    if (pts) pts.textContent = GRADES[this.value] ?? 0;
    if (this.value === 'F') tr.classList.add('fail-row');
    else tr.classList.remove('fail-row');
    saveCurrentSemRows();
  });

  tr.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      saveCurrentSemRows();
    });
  });

  saveCurrentSemRows();
}

export function removeCalcRow(id) {
  document.getElementById('row-' + id)?.remove();
  appState.calcRows = appState.calcRows.filter(r => r !== id);
  saveCurrentSemRows();
}

export function clearCalc() {
  const tbody = document.getElementById('calc-tbody');
  if (tbody) tbody.innerHTML = '';
  appState.calcRows = [];
  const sgpaEl = document.getElementById('sgpa-result');
  if (sgpaEl) sgpaEl.textContent = '–';
  const sgpaGradeEl = document.getElementById('sgpa-grade');
  if (sgpaGradeEl) sgpaGradeEl.textContent = 'Calculate to see your grade';
  const backlogWarnEl = document.getElementById('backlog-warn');
  if (backlogWarnEl) backlogWarnEl.style.display = 'none';
  const sem = appState.calcSemesters.find(s => s.id === appState.currentSemId);
  if (sem) { sem.rows = []; sem.sgpa = null; }
  renderSemTabs();
  saveCalcState();
  showToast('Semester cleared', 'blue');
}

export async function renderCalc() {
  if (!appState.calcSemesters.length) {
    await initCalc();
  } else {
    renderSemTabs();
    renderCalcSemTitle();
    const tbody = document.getElementById('calc-tbody');
    if (tbody && !tbody.children.length) {
      const sem = appState.calcSemesters.find(s => s.id === appState.currentSemId);
      if (sem && sem.rows.length) {
        sem.rows.forEach(r => addCalcRow(r.name, r.credits, r.grade));
      } else {
        DEFAULT_SUBJECTS.forEach(s => addCalcRow(s));
      }
    }
  }
}

export function calculateGPA() {
  const rows = document.querySelectorAll('#calc-tbody tr');
  let totalPoints = 0, totalCredits = 0;
  const failed = [], gradeCount = {};
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input,select');
    const credits = parseInt(inputs[1]?.value) || 0;
    const grade = inputs[2]?.value || 'F';
    const pts = GRADES[grade] ?? 0;
    totalPoints += credits * pts;
    totalCredits += credits;
    if (grade === 'F' || grade === 'Fail') failed.push(inputs[0]?.value || 'Unknown Subject');
    gradeCount[grade] = (gradeCount[grade] || 0) + 1;
  });
  if (!totalCredits) { showToast('Add subjects first', 'red'); return; }
  const sgpa = parseFloat((totalPoints / totalCredits).toFixed(2));

  // Store in current semester
  const sem = appState.calcSemesters.find(s => s.id === appState.currentSemId);
  if (sem) sem.sgpa = sgpa;
  saveCurrentSemRows();
  renderSemTabs();

  const sgpaEl = document.getElementById('sgpa-result');
  if (sgpaEl) sgpaEl.textContent = sgpa.toFixed(2);
  
  // Real CGPA = average of all calculated sems
  const calcdSems = appState.calcSemesters.filter(s => s.sgpa !== null);
  const cgpaEl = document.getElementById('cgpa-result');
  if (cgpaEl) {
    if (calcdSems.length > 0) {
      const cgpa = Math.min(10, calcdSems.reduce((s, x) => s + x.sgpa, 0) / calcdSems.length);
      cgpaEl.textContent = cgpa.toFixed(2);
      const summaryEl = document.getElementById('all-sems-summary');
      const listEl = document.getElementById('all-sems-list');
      if (summaryEl && listEl && calcdSems.length > 1) {
        summaryEl.style.display = 'block';
        listEl.innerHTML = calcdSems.map(s =>
          `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:0.82rem;">
          <span style="font-weight:600;">${s.label}</span>
          <span style="color:var(--primary);font-weight:700;">${s.sgpa.toFixed(2)}</span></div>`
        ).join('') +
          `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:0.88rem;">
          <span style="font-weight:700;">Overall CGPA</span>
          <span style="color:var(--teal);font-weight:800;">${cgpa.toFixed(2)}</span></div>`;
      }
    } else {
      cgpaEl.textContent = sgpa.toFixed(2);
    }
  }
  saveCalcState();
  const gradeLabel = sgpa >= 9 ? 'Outstanding 🏆' : sgpa >= 8 ? 'Excellent 🌟' : sgpa >= 7 ? 'Very Good 👍' : sgpa >= 6 ? 'Good ✅' : sgpa >= 5 ? 'Average ⚠️' : 'Needs Improvement 📚';
  const sgpaGradeEl = document.getElementById('sgpa-grade');
  if (sgpaGradeEl) sgpaGradeEl.textContent = gradeLabel;

  // Grade distribution bars
  const colors = { O: 'var(--green)', 'A+': 'var(--teal)', A: 'var(--primary)', 'B+': 'var(--lavender)', B: 'var(--amber)', C: '#f97316', F: 'var(--red)' };
  const maxCount = Math.max(...Object.values(gradeCount), 1);
  const gradeDistEl = document.getElementById('grade-dist');
  if (gradeDistEl) {
    gradeDistEl.innerHTML = `
      <div style="display:flex;gap:4px;align-items:flex-end;height:60px;margin-bottom:6px;">
        ${Object.entries(GRADES).map(([g]) => {
      const cnt = gradeCount[g] || 0;
      const h = cnt ? Math.max(8, (cnt / maxCount) * 52) : 0;
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
            <div style="width:100%;height:${h}px;border-radius:4px 4px 0 0;background:${colors[g] || 'var(--border)'};transition:height 0.5s;"></div>
            <div style="font-size:0.65rem;font-weight:700;color:var(--text3);">${g}</div>
          </div>`;
    }).join('')}
      </div>`;
  }

  // Backlogs
  if (failed.length > 0) {
    appState.backlogSubjects = [...new Set([...appState.backlogSubjects, ...failed])];
    const backlogBadgeEl = document.getElementById('backlog-badge');
    if (backlogBadgeEl) backlogBadgeEl.textContent = appState.backlogSubjects.length;
    const backlogWarnEl = document.getElementById('backlog-warn');
    if (backlogWarnEl) backlogWarnEl.style.display = 'block';
    const backlogWarnSubjectsEl = document.getElementById('backlog-warn-subjects');
    if (backlogWarnSubjectsEl) backlogWarnSubjectsEl.textContent = `Subjects moved to Backlog: ${failed.join(', ')}`;
    showToast(`⚠️ ${failed.length} backlog subject(s) detected!`, 'red');
  } else {
    const backlogWarnEl = document.getElementById('backlog-warn');
    if (backlogWarnEl) backlogWarnEl.style.display = 'none';
    showToast(`✅ SGPA: ${sgpa} — Great work!`, 'green');
  }
}
