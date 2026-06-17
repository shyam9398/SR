import appState from '../../core/appState.js';
import { showToast } from '../../utils/helpers.js';
import { renderSubjects } from './subjectRenderer.js';

export function buildSemSwitcher(selectedOverride) {
  const user = appState.user || {};
  const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const sw = document.getElementById('sem-switcher');
  if (!sw) return;
  const cur = selectedOverride || user.semester || '3-1';
  sw.innerHTML = allSems.map(s => `<option value="${s}" ${s === cur ? 'selected' : ''}>${s}</option>`).join('');
}

export function switchSemester(val) {
  buildSemSwitcher(val);
  renderSubjects(val);
  showToast(`Switched to Semester ${val}`, 'blue');
}
