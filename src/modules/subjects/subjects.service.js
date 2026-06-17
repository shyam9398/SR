import appState from '../../core/appState.js';
import { SUBJECTS_DB, UNIT_TOPICS } from '../../core/constants.js';
import { readStudentJson } from '../../utils/helpers.js';
import { supabase } from '../../services/supabase.service.js';

export { SUBJECTS_DB, UNIT_TOPICS };

export function getStudentAssignedSubjects() {
  const sem = appState.user?.semester || '3-1';
  const customSubjects = readStudentJson('edusync_custom_subjects', []);
  const colorOptions = ['teal', 'lavender', 'blue', 'green', 'amber'];
  return customSubjects
    .filter(s =>
      s.sem === sem &&
      (!appState.user?.branch || s.branch === appState.user.branch) &&
      (!appState.user?.regulation || s.reg === appState.user.regulation || !s.reg)
    )
    .map((s, i) => {
      const units = readStudentJson('edusync_units_' + s.id, []);
      return {
        id: 'custom_' + s.id,
        rawId: s.id,
        name: s.name,
        code: s.code || 'Subject',
        credits: parseInt(s.credits) || 3,
        units: units.length || 5,
        color: colorOptions[i % colorOptions.length],
        icon: '📖',
        branch: s.branch,
        isCustom: true
      };
    });
}

export function getSubjectProgress(subj) {
  if (!subj) return 0;
  if (typeof subj === 'string') {
    const found = Object.values(SUBJECTS_DB).flat().find(s => s.id === subj);
    if (found) {
      subj = found;
    } else {
      const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
      const cFound = customSubjects.find(s => s.id === subj || s.rawId === subj);
      if (cFound) subj = cFound;
      else return 0;
    }
  }
  const subjId = subj.id;

  let units = [];
  if (subj.rawId) {
    units = JSON.parse(localStorage.getItem('edusync_units_' + subj.rawId) || '[]');
  } else if (subj.isCustom || (subjId && subjId.toString().startsWith('custom_'))) {
    const rawId = subjId.toString().replace('custom_', '');
    units = JSON.parse(localStorage.getItem('edusync_units_' + rawId) || '[]');
  }
  if (!units.length) {
    units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  }

  const unitCount = subj.units || 5;
  let totalTopics = 0;
  let completedTopics = 0;
  const completed = JSON.parse(localStorage.getItem('edusync_completed_topics') || '[]');

  if (units.length > 0) {
    units.forEach(u => {
      const topicCount = (u.topics || []).length;
      totalTopics += topicCount;
      (u.topics || []).forEach((t, i) => {
        const key = `${subjId}-${u.id}-${i}`;
        if (completed.includes(key)) {
          completedTopics++;
        }
      });
    });
  } else {
    const topicsDb = UNIT_TOPICS[subjId] || UNIT_TOPICS.default;
    for (let u = 1; u <= unitCount; u++) {
      const topics = topicsDb[u] || UNIT_TOPICS.default[1];
      totalTopics += topics.length;
      topics.forEach((t, i) => {
        const key = `${subjId}-${u}-${i}`;
        if (completed.includes(key)) {
          completedTopics++;
        }
      });
    }
  }

  if (totalTopics === 0) return 0;
  return Math.round((completedTopics / totalTopics) * 100);
}

export async function fetchSubjects(filters = {}) {
  const sc = supabase;
  if (!sc) return { data: [], error: { message: 'Supabase client missing' } };
  
  try {
    let q = sc.from('subjects').select('*').order('name', { ascending: true });
    if (filters.semester) q = q.eq('semester', filters.semester);
    if (filters.branch) q = q.eq('branch', filters.branch);
    if (filters.regulation_code) q = q.eq('regulation_code', filters.regulation_code);
    if (filters.university_name) q = q.eq('university_name', filters.university_name);
    if (filters.created_by_subadmin_id) q = q.eq('created_by', filters.created_by_subadmin_id);
    
    const { data, error } = await q;
    return { data: data || [], error };
  } catch (e) {
    return { data: [], error: e };
  }
}
