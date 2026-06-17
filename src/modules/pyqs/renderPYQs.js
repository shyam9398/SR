import appState from '../../core/appState.js';
import { v10Esc } from '../../utils/helpers.js';
import { fetchUnitRoadmap } from '../roadmap/roadmap.service.js';
import { listContentItems } from '../../services/api.service.js';

export async function renderPYQ(filterYear, subjectId, unitNum) {
  const listEl = document.getElementById('pyq-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text3);"><div style="font-size:3rem;margin-bottom:1rem;">⏳</div><div style="font-weight:600;">Loading questions...</div></div>';

  const subject = appState.currentSubject;
  const uNum = unitNum || appState.currentUnit || 1;
  let customPYQs = [];

  if (subject) {
    const ctx = await fetchUnitRoadmap({
      subject,
      unit: { id: uNum, name: `Unit ${uNum}`, dbUnitId: subject?.dbUnitIds?.[uNum] },
    });
    if (ctx?.data?.subjectId && ctx?.data?.unitId) {
      const { data } = await listContentItems({ subjectId: ctx.data.subjectId, unitId: ctx.data.unitId, contentType: 'pyq' });
      if (data) {
        customPYQs = data.map(p => {
          const meta = p.metadata || {};
          return {
            q: p.title || p.body || 'Untitled Question',
            year: String(meta.year || '2024'),
            count: parseInt(meta.count) || 1,
            ans: meta.answer || p.body || 'Answer not provided.',
            isAdmin: true
          };
        });
      }
    }
  }

  // Build year filter dynamically
  const years = [...new Set(customPYQs.map(p => p.year))].sort((a, b) => b - a);
  const filtersEl = document.getElementById('pyq-filters');
  if (filtersEl) {
    filtersEl.innerHTML = years.length > 0 ?
      `<div class="pyq-filter ${!filterYear || filterYear === 'all' ? 'active' : ''}" onclick="window.filterPYQ(this,'all')">All Years</div>` +
      years.map(y => `<div class="pyq-filter ${filterYear === y ? 'active' : ''}" onclick="window.filterPYQ(this,'${y}')">${y}</div>`).join('') :
      '';
  }

  const data = filterYear && filterYear !== 'all' ? customPYQs.filter(p => p.year === filterYear) : customPYQs;

  listEl.innerHTML = data.length ? data.map((p, i) => `
    <div class="pyq-item" id="pyq-${i}">
      <div class="pyq-header" onclick="window.togglePYQ(${i})">
        <div class="pyq-q">${v10Esc(p.q)} <span style="font-size:0.65rem;background:var(--teal);color:#fff;padding:1px 7px;border-radius:50px;vertical-align:middle;">SUPABASE</span></div>
        <div class="pyq-meta">
          <span class="pyq-year">📅 ${v10Esc(p.year)}</span>
          <span class="pyq-count">× ${v10Esc(p.count)} times</span>
        </div>
      </div>
      <div class="pyq-answer">${v10Esc(p.ans)}</div>
    </div>`).join('') :
    `<div style="text-align:center;padding:3rem;color:var(--text3);">
      <div style="font-size:3rem;margin-bottom:1rem;">📝</div>
      <div style="font-weight:600;">No content available yet</div>
      <div style="font-size:0.82rem;margin-top:4px;">Creator will upload questions for this unit</div>
    </div>`;
}

export function togglePYQ(i) {
  document.getElementById('pyq-' + i)?.classList.toggle('expanded');
}

export function filterPYQ(el, year) {
  document.querySelectorAll('.pyq-filter').forEach(f => f.classList.remove('active'));
  el.classList.add('active');
  renderPYQ(year);
}

export function v10PYQForm(subjectName, unitId) {
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => String(p.subject) === String(subjectName) && String(p.unit) === String(unitId));
  const s = String(subjectName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  
  let topicSelectHTML = '';
  if (typeof window.v10TopicSelect === 'function') {
    topicSelectHTML = window.v10TopicSelect(subjectName, unitId);
  } else {
    topicSelectHTML = `<select class="select" id="v10-pyq-topic-select-${unitId}"><option value="">Select Topic</option></select>`;
  }

  return `<div class="v10-form"><p class="hint">PYQs are linked to a roadmap topic.</p><div class="input-group"><span class="v10-label">TOPIC</span>${topicSelectHTML}</div><div class="v10-2col"><div class="input-group"><span class="v10-label">YEAR</span><input class="input" id="v10-pyqyr-${unitId}" type="number" min="2000" max="2099"></div><div class="input-group"><span class="v10-label">MARKS</span><input class="input" id="v10-pyqmarks-${unitId}" type="number" min="1"></div></div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-pyqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="window.v10UploadPYQ('${s}','${unitId}')">Save PYQ</button></div>${pyqs.length ? `<div class="v10-items"><div class="v10-items-head">PYQs (${pyqs.length})</div>${pyqs.map(p => `<div class="v10-item"><span>📝</span><div class="v10-item-body"><div class="v10-item-title">${v10Esc(p.question)}</div><div class="v10-item-meta">${v10Esc(p.topicName || 'No topic')} · ${v10Esc(p.year || '-')} · ${v10Esc(p.marks || p.count || '-')} marks</div></div><button class="v10-del v10-edit-btn" onclick="window.aimeasyEditPYQ('${p.id}','${s}','${unitId}')" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="window.v10DeletePYQ('${p.id}','${s}','${unitId}')">Del</button></div>`).join('')}</div>` : ''}`;
}
