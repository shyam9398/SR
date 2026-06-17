import { showToast, v11Confirm } from '../../utils/helpers.js';

function isCurrentSubjectOwned() {
  const currentSubj = window.APP?.currentSubject || window._v10SASubj;
  if (!currentSubj) return true;
  const sa = window.APP?.subAdminData || {};
  if (!sa.username) return true;
  if (window.APP?.adminType === 'admin') return true;
  return currentSubj.created_by === sa.username;
}

export async function v10DeleteNote(id, subjectName, unitId) {
  if (!isCurrentSubjectOwned()) {
    showToast('You do not have write access to this subject.', 'red');
    return;
  }
  v11Confirm('Are you sure you want to delete this note?', async () => {
    try {
      if (id && !String(id).startsWith('temp_')) {
        if (typeof window.deleteContent === 'function') {
          await window.deleteContent(id);
        }
      }
      const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
      localStorage.setItem('edusync_admin_notes', JSON.stringify(notes.filter(n => String(n.id) !== String(id) && String(n.dbContentId) !== String(id))));
      
      if (typeof window.v10RefreshContentPane === 'function') {
        await window.v10RefreshContentPane('notes', subjectName, unitId);
      }
      if (typeof window.renderSubAdminDashboardLive === 'function') {
        window.renderSubAdminDashboardLive();
      }
      showToast('Note deleted successfully', 'green');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'red');
    }
  });
}

let isSavingNote = false;
export async function v10UploadNote(subjectName, unitId) {
  if (isSavingNote) return;
  if (!isCurrentSubjectOwned()) {
    showToast('You do not have write access to this subject.', 'red');
    return;
  }
  const form = document.querySelector(`#v10-notes-${unitId} .v10-form`);
  const btn = form?.querySelector('.v10-submit');
  
  const link = document.getElementById('v10-nlink-' + unitId)?.value.trim();
  const description = document.getElementById('v10-ndesc-' + unitId)?.value.trim() || '';
  
  let topicId = '', topicName = '';
  if (typeof window.v10ReadTopicInput === 'function') {
    const topicInfo = window.v10ReadTopicInput(unitId, 'notes');
    topicId = topicInfo.topicId;
    topicName = topicInfo.topicName;
  } else {
    topicName = document.getElementById(`v10-notes-topic-text-${unitId}`)?.value.trim() || '';
  }
  
  if (!topicName) {
    showToast('Enter topic text or select a topic', 'red');
    return;
  }
  
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }
  isSavingNote = true;

  try {
    let savedData = { id: 'temp_' + Date.now() };
    if (typeof window.createContent === 'function' && typeof window.v10SubjectForDb === 'function' && typeof window.v10UnitForDb === 'function') {
      const subj = window.v10SubjectForDb(subjectName);
      const unit = window.v10UnitForDb(unitId);
      
      savedData = await window.createContent('note', {
        subjectId: subj.dbSubjectId || subj.id,
        unitId: unit.dbUnitId || unit.id,
        title: topicName,
        body: description,
        url: link,
        metadata: { topicId, topicText: topicName }
      });
    }

    const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
    const note = {
      id: savedData.id,
      dbContentId: savedData.id,
      title: topicName,
      description,
      type: 'link',
      link,
      subject: subjectName,
      unit: unitId,
      topicId,
      topicName,
      uploadedAt: new Date().toLocaleDateString()
    };
    notes.push(note);
    localStorage.setItem('edusync_admin_notes', JSON.stringify(notes));
    
    if (typeof window.v10RefreshContentPane === 'function') {
      await window.v10RefreshContentPane('notes', subjectName, unitId);
    }
    if (typeof window.renderSubAdminDashboardLive === 'function') {
      window.renderSubAdminDashboardLive();
    }
    showToast('✅ Note saved under topic.', 'green');
  } catch (err) {
    showToast('DB save failed: ' + err.message, 'red');
  } finally {
    isSavingNote = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Save Note';
    }
  }
}
