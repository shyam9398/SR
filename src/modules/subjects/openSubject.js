import appState from '../../core/appState.js';
import { SUBJECTS_DB } from '../../core/constants.js';
import { recordStudyActivity } from '../../utils/helpers.js';
import { fetchSubjects, getSubjectProgress } from './subjects.service.js';
import { renderUnits } from '../units/renderUnits.js';

export async function openSubject(id) {
  const sem = document.getElementById('sem-switcher')?.value || appState.user?.semester || '3-1';
  const builtinSubjects = SUBJECTS_DB[sem] || SUBJECTS_DB['3-1'];
  let subj = builtinSubjects.find(s => s.id === id);

  if (!subj && id.startsWith('custom_')) {
    const rawId = id.replace('custom_', '');
    let dbSubjects = [];
    const filters = {
      semester: sem,
      university_name: appState.user?.university || 'JNTUK',
      branch: appState.user?.branch,
      regulation_code: appState.user?.regulation || 'R23'
    };
    const { data } = await fetchSubjects(filters);
    if (data) dbSubjects = data;

    const cs = dbSubjects.find(s => String(s.id) === rawId);
    if (cs) {
      const colorOptions = ['teal', 'lavender', 'blue', 'green', 'amber'];
      let unitCount = 5;
      if (window.aimeasyFetchUnits) {
        const { data: units } = await window.aimeasyFetchUnits(cs.id);
        if (units) unitCount = units.length;
      }

      subj = {
        id: id,
        rawId: cs.id,
        name: cs.name,
        code: cs.code || '',
        credits: parseInt(cs.credits) || 3,
        units: unitCount || 5,
        progress: 0,
        color: colorOptions[0],
        icon: '📖',
        isCustom: true,
        sem: cs.semester,
        uni: cs.university_name,
        reg: cs.regulation_code,
        branch: cs.branch
      };
    }
  }
  if (!subj) return;
  appState.currentSubject = subj;
  
  if (typeof window.addToRecentlyOpened === 'function') {
    window.addToRecentlyOpened(subj.name, subj.code, subj.icon, subj.id);
  }
  recordStudyActivity('subject_opened', { subjectId: subj.id, subjectName: subj.name });
  
  if (typeof window.navigateTo === 'function') {
    window.navigateTo('units');
  } else {
    document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
    const pageUnits = document.getElementById('page-units');
    if (pageUnits) pageUnits.style.display = 'block';
  }
  
  const subjNameEl = document.getElementById('units-subject-name');
  if (subjNameEl) subjNameEl.textContent = `${subj.icon} ${subj.name}`;
  const topTitleEl = document.getElementById('topbar-title');
  if (topTitleEl) topTitleEl.textContent = subj.name;
  const breadEl = document.getElementById('topbar-breadcrumb');
  if (breadEl) breadEl.innerHTML = `Subjects / <span>${subj.name}</span>`;

  const tagsEl = document.getElementById('units-tags');
  if (tagsEl) {
    const progress = getSubjectProgress(subj);
    tagsEl.innerHTML = `<span class="badge badge-primary">${subj.code}</span><span class="badge badge-teal">${subj.credits} Credits</span><span class="badge badge-lavender">${progress}% Complete</span>`;
  }

  await renderUnits(subj);
}
export default openSubject;
