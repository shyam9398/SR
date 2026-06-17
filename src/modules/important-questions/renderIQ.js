import appState from '../../core/appState.js';
import { v10Esc } from '../../utils/helpers.js';
import { fetchUnitRoadmap } from '../roadmap/roadmap.service.js';
import { listContentItems } from '../../services/api.service.js';

export async function renderIQ(subjectId, unitNum) {
  const listEl = document.getElementById('iq-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text3);"><div style="font-size:3rem;margin-bottom:1rem;">⏳</div><div style="font-weight:600;">Loading questions...</div></div>';

  const subject = appState.currentSubject;
  const uNum = unitNum || appState.currentUnit || 1;
  let customIQs = [];

  if (subject) {
    const ctx = await fetchUnitRoadmap({
      subject,
      unit: { id: uNum, name: `Unit ${uNum}`, dbUnitId: subject?.dbUnitIds?.[uNum] },
    });
    if (ctx?.data?.subjectId && ctx?.data?.unitId) {
      const { data } = await listContentItems({ subjectId: ctx.data.subjectId, unitId: ctx.data.unitId, contentType: 'iq' });
      if (data) {
        customIQs = data.map(q => {
          const meta = q.metadata || {};
          return {
            q: q.title || q.body || 'Untitled Question',
            priority: meta.priority || 'med',
            tags: (meta.tags || '').split(',').map(t => t.trim()).filter(Boolean),
            isAdmin: true
          };
        });
      }
    }
  }

  listEl.innerHTML = customIQs.length ? customIQs.map((q, i) => `
    <div class="iq-item">
      <div class="iq-header">
        <div class="iq-q">Q${i + 1}. ${v10Esc(q.q)} <span style="font-size:0.65rem;background:var(--teal);color:#fff;padding:1px 7px;border-radius:50px;vertical-align:middle;">SUPABASE</span></div>
        <div class="iq-actions">
          <button class="btn-icon" onclick="showToast('🔖 Bookmarked!','amber')" title="Bookmark">🔖</button>
          <button class="btn-icon" onclick="showToast('📋 Copied!','blue')" title="Copy">📋</button>
        </div>
      </div>
      <div class="iq-footer">
        <span class="priority-badge priority-${v10Esc(q.priority)}">${q.priority === 'high' ? '🔴 High Priority' : q.priority === 'med' ? '🟡 Medium' : '🟢 Low'}</span>
        ${q.tags.map(t => `<span class="tag">${v10Esc(t)}</span>`).join('')}
      </div>
    </div>`).join('') :
    `<div style="text-align:center;padding:3rem;color:var(--text3);">
      <div style="font-size:3rem;margin-bottom:1rem;">⭐</div>
      <div style="font-weight:600;">No content available yet</div>
      <div style="font-size:0.82rem;margin-top:4px;">Creator will add questions for this unit</div>
    </div>`;
}

export function v10IQForm(subjectName, unitId) {
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => String(q.subject) === String(subjectName) && String(q.unit) === String(unitId));
  const s = String(subjectName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  
  let topicSelectHTML = '';
  if (typeof window.v10TopicSelect === 'function') {
    topicSelectHTML = window.v10TopicSelect(subjectName, unitId);
  } else {
    topicSelectHTML = `<select class="select" id="v10-iq-topic-select-${unitId}"><option value="">Select Topic</option></select>`;
  }

  return `<div class="v10-form"><p class="hint">Important questions are linked to a roadmap topic.</p><div class="input-group"><span class="v10-label">TOPIC</span>${topicSelectHTML}</div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-iqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><div class="input-group"><span class="v10-label">PRIORITY</span><select class="select" id="v10-iqprio-${unitId}"><option value="high">High</option><option value="med" selected>Medium</option><option value="low">Low</option></select></div><button class="v10-submit" onclick="window.v10UploadIQ('${s}','${unitId}')">Save Important Question</button></div>${iqs.length ? `<div class="v10-items"><div class="v10-items-head">Important Questions (${iqs.length})</div>${iqs.map(q => `<div class="v10-item"><span>⭐</span><div class="v10-item-body"><div class="v10-item-title">${v10Esc(q.question)}</div><div class="v10-item-meta">${v10Esc(q.topicName || 'No topic')} · ${v10Esc(q.priority || 'med')}</div></div><button class="v10-del v10-edit-btn" onclick="window.aimeasyEditIQ('${q.id}','${s}','${unitId}')" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="window.v10DeleteIQ('${q.id}','${s}','${unitId}')">Del</button></div>`).join('')}</div>` : ''}`;
}
