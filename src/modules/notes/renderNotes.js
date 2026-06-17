import appState from '../../core/appState.js';
import { v10Esc } from '../../utils/helpers.js';
import { fetchUnitRoadmap } from '../roadmap/roadmap.service.js';
import { listContentItems } from '../../services/api.service.js';

export async function renderNotes(subjectId, unitNum) {
  const listEl = document.getElementById('notes-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text3);"><div style="font-size:3rem;margin-bottom:1rem;">⏳</div><div style="font-weight:600;">Loading notes...</div></div>';

  const subject = appState.currentSubject;
  const unitId = unitNum || appState.currentUnit || 1;
  let customNotes = [];

  if (subject) {
    const ctx = await fetchUnitRoadmap({
      subject,
      unit: { id: unitId, name: `Unit ${unitId}`, dbUnitId: subject?.dbUnitIds?.[unitId] },
    });
    if (ctx?.data?.subjectId && ctx?.data?.unitId) {
      const { data } = await listContentItems({ subjectId: ctx.data.subjectId, unitId: ctx.data.unitId, contentType: 'note' });
      if (data) {
        customNotes = data.map(n => ({
          title: n.title || 'Untitled Note',
          type: n.url?.endsWith('.pdf') ? 'pdf' : (n.url?.endsWith('.doc') || n.url?.endsWith('.docx') ? 'doc' : 'link'),
          link: n.url,
          uploadedAt: n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recently'
        }));
      }
    }
  }

  listEl.innerHTML = customNotes.length ? customNotes.map(n => `
    <div class="note-row">
      <div class="note-icon">${n.type === 'pdf' ? '📄' : n.type === 'doc' ? '📝' : '🔗'}</div>
      <div class="note-info">
        <div class="note-title">${v10Esc(n.title)} <span style="font-size:0.65rem;background:var(--teal);color:#fff;padding:1px 7px;border-radius:50px;vertical-align:middle;">SUPABASE</span></div>
        <div class="note-desc">Uploaded ${v10Esc(n.uploadedAt)}</div>
      </div>
      <div class="note-actions">
        ${n.link ? `
          <button class="btn btn-ghost btn-sm" onclick="window.previewNoteInline('${n.link.replace(/'/g, "\\'")}','${n.title.replace(/'/g, "\\'")}')">👁️ Preview</button>
          <button class="btn btn-primary btn-sm" onclick="window.downloadNote('${n.link.replace(/'/g, "\\'")}','${n.title.replace(/'/g, "\\'")}')">📥 Download</button>
        ` : `
          <button class="btn btn-ghost btn-sm" onclick="showToast('📄 No file linked','amber')">Preview</button>
          <button class="btn btn-primary btn-sm" onclick="showToast('📥 No download available','amber')">Download</button>
        `}
      </div>
    </div>`).join('') :
    `<div style="text-align:center;padding:3rem;color:var(--text3);">
      <div style="font-size:3rem;margin-bottom:1rem;">📄</div>
      <div style="font-weight:600;">No content available yet</div>
      <div style="font-size:0.82rem;margin-top:4px;">Creator will upload notes for this unit</div>
    </div>`;
}

export function v10NotesForm(subjectName, unitId) {
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => String(n.subject) === String(subjectName) && String(n.unit) === String(unitId));
  const s = String(subjectName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  
  let topicFieldHTML = '';
  if (typeof window.v10TopicFieldsHTML === 'function') {
    topicFieldHTML = window.v10TopicFieldsHTML(subjectName, unitId, 'notes');
  } else {
    topicFieldHTML = `<div class="input-group"><span class="v10-label">TOPIC NAME</span><input class="input" id="v10-notes-topic-text-${unitId}" placeholder="Topic text"></div>`;
  }

  return `<div class="v10-form"><p class="hint">Select an existing roadmap topic or type a new topic.</p>${topicFieldHTML}<div class="input-group"><span class="v10-label">NOTE URL / FILE</span><input class="input" id="v10-nlink-${unitId}" placeholder="https://drive.google.com/..." type="url"></div><div class="input-group"><span class="v10-label">DESCRIPTION</span><textarea class="input" id="v10-ndesc-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="window.v10UploadNote('${s}','${unitId}')">Save Note</button></div>${notes.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Notes (${notes.length})</div>${notes.map(n => `<div class="v10-item"><span>📄</span><div class="v10-item-body"><div class="v10-item-title">${v10Esc(n.topicName || n.title)}</div><div class="v10-item-meta">${v10Esc(n.description || n.title || '')} · ${v10Esc(n.uploadedAt || '')}</div></div><button class="v10-del v10-edit-btn" onclick="window.aimeasyEditNote('${n.id}','${s}','${unitId}')" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="window.v10DeleteNote('${n.id}','${s}','${unitId}')">Delete</button></div>`).join('')}</div>` : ''}`;
}
