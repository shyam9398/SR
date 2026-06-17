import { showToast } from '../../utils/helpers.js';
import { downloadNote } from './downloadNote.js';

export function previewNoteInline(link, title) {
  if (!link) {
    showToast('No preview available for this note', 'amber');
    return;
  }
  const modal = document.getElementById('note-preview-modal');
  const bodyEl = document.getElementById('note-preview-body');
  const titleEl = document.getElementById('note-preview-title');
  const dlBtn = document.getElementById('note-download-btn');
  if (titleEl) titleEl.textContent = title || 'Note Preview';
  if (dlBtn) dlBtn.onclick = function () { downloadNote(link, title); };

  let embedHTML = '';
  if (link.includes('drive.google.com')) {
    const fileIdMatch = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const embedUrl = fileIdMatch
      ? `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
      : link.replace('/view', '/preview').replace('?usp=sharing', '');
    embedHTML = `<iframe src="${embedUrl}" allow="autoplay" style="width:100%;height:100%;border:none;"></iframe>`;
  } else if (link.endsWith('.pdf') || link.includes('pdf')) {
    embedHTML = `<iframe src="${link}#toolbar=1&navpanes=0" style="width:100%;height:100%;border:none;"></iframe>`;
  } else {
    embedHTML = `<iframe src="${link}" style="width:100%;height:100%;border:none;"></iframe>`;
  }
  
  if (bodyEl) bodyEl.innerHTML = embedHTML;
  if (modal) modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeNotePreview() {
  const modal = document.getElementById('note-preview-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}
