import appState from '../../core/appState.js';
import { v10Esc } from '../../utils/helpers.js';
import { fetchUnits } from './units.service.js';

export async function renderUnits(subj) {
  const grid = document.getElementById('units-grid');
  if (!grid) return;
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text3);"><div style="font-size:3rem;margin-bottom:1rem;">⏳</div><div style="font-weight:700;font-size:1rem;">Loading units...</div></div>';

  let units = [];
  const rawSubjectId = subj.rawId || subj.id.toString().replace('custom_', '');

  const { data, error } = await fetchUnits(rawSubjectId);
  if (!error && data) {
    units = data;
  }

  if (!units.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text3);"><div style="font-size:2.5rem;margin-bottom:0.8rem;">📋</div><div style="font-weight:700;">No units defined yet</div><div style="font-size:0.82rem;margin-top:4px;">The Sub Admin has not created units for this subject yet.</div></div>';
    return;
  }

  grid.innerHTML = units.map((u, i) => {
    const topicCount = 0;
    const completedCount = 0;
    const pct = 0;
    const firstTopic = 'Click to view content';
    const contentTotal = 'View';

    const sortOrder = u.sort_order || (i + 1);
    const title = window.aimeasyUnitLabel ? window.aimeasyUnitLabel(u, sortOrder) : `Unit - ${sortOrder}`;

    return '<div class="unit-card" onclick="openUnit(' + sortOrder + ',\'' + subj.id + '\')" style="animation-delay:' + (i * 0.07) + 's">'
      + '<div class="unit-num">' + sortOrder + '</div>'
      + '<div class="unit-name">' + v10Esc(title) + '</div>'
      + '<div class="unit-topics">' + firstTopic + '</div>'
      + '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:10px;flex-wrap:wrap;">'
      + '<span class="badge badge-primary">View Content</span>'
      + '</div>'
      + '<div class="unit-progress-wrap">'
      + '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">'
      + '<span style="font-size:0.72rem;color:var(--text3);">Content</span>'
      + '<span style="font-size:0.72rem;font-weight:700;color:var(--primary);">' + contentTotal + '</span>'
      + '</div>'
      + '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>'
      + '</div></div>';
  }).join('');
}
