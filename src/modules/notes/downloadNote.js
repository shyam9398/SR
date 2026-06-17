import { showToast } from '../../utils/helpers.js';

export function downloadNote(link, title) {
  if (!link) {
    showToast('No download available', 'amber');
    return;
  }
  const fileIdMatch = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    const dlUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = title || 'note';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    window.open(link, '_blank');
  }
  showToast('📥 Downloading...', 'green');
}
export default downloadNote;
