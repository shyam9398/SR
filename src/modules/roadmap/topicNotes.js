import appState from '../../core/appState.js';
import { selectVideoItem } from '../videos/selectVideo.js';

export function selectTopicUrl(topicIndex, urlIndex) {
  const matchIndex = (appState._videoItems || []).findIndex(
    item => item.topicIndex === topicIndex && item.videoIndex === urlIndex
  );
  if (matchIndex >= 0) {
    selectVideoItem(matchIndex);
  }
}

export function updateRoadmapTopicSelector() {
  const select = document.getElementById('sa-vtopic');
  if (!select) return;
  const subj = document.getElementById('sa-vsubject')?.value;
  const unit = document.getElementById('sa-vunit')?.value;
  if (!subj || !unit) {
    select.innerHTML = '<option value="">Select Topic</option>';
    return;
  }
  
  const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const cs = customSubjects.find(s => s.name === subj || String(s.id) === subj);
  const subjId = cs ? cs.id : subj;
  
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  const u = units.find(item => String(item.id) === String(unit));
  
  if (u && Array.isArray(u.topics)) {
    select.innerHTML = '<option value="">Select Topic</option>' + 
      u.topics.map(t => `<option value="${t.name || t}">${t.name || t}</option>`).join('');
  } else {
    select.innerHTML = '<option value="">Select Topic</option>';
  }
}
