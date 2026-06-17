import { renderSubjects, openSubject, switchSemester, getSubjectProgress, getStudentAssignedSubjects, fetchSubjects } from '../modules/subjects/index.js';

window.renderSubjects = renderSubjects;
window.openSubject = openSubject;
window.switchSemester = switchSemester;
window.getSubjectProgress = getSubjectProgress;
window.getStudentAssignedSubjects = getStudentAssignedSubjects;
window.aimeasyFetchSubjects = fetchSubjects;
window.v11SyncCustomSubjectsFromDb = async function() {
  if (typeof window.aimeasyFetchSubjects !== 'function') return;
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
};
