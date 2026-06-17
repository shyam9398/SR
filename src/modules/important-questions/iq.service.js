import { showToast, v11Confirm } from '../../utils/helpers.js';

function isCurrentSubjectOwned() {
  const currentSubj = window.APP?.currentSubject || window._v10SASubj;
  if (!currentSubj) return true;
  const sa = window.APP?.subAdminData || {};
  if (!sa.username) return true;
  if (window.APP?.adminType === 'admin') return true;
  return currentSubj.created_by === sa.username;
}

let isSavingIQ = false;
export async function v10UploadIQ(subjectName, unitId) {
  if (isSavingIQ) return;
  if (!isCurrentSubjectOwned()) {
    showToast('You do not have write access to this subject.', 'red');
    return;
  }
  const form = document.querySelector(`#v10-iq-${unitId} .v10-form`);
  const btn = form?.querySelector('.v10-submit');

  const question = document.getElementById('v10-iqtxt-' + unitId)?.value.trim();
  const priority = document.getElementById('v10-iqprio-' + unitId)?.value;
  
  let topicId = '', topicName = '';
  if (typeof window.v10ReadTopicInput === 'function') {
    const topicInfo = window.v10ReadTopicInput(unitId, 'iq');
    topicId = topicInfo.topicId;
    topicName = topicInfo.topicName;
  } else {
    topicName = document.getElementById(`v10-iq-topic-text-${unitId}`)?.value.trim() || '';
  }

  if (!topicName) { showToast('Enter topic text or select a topic', 'red'); return; }
  if (!question) { showToast('Enter question', 'red'); return; }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }
  isSavingIQ = true;

  try {
    let savedData = { id: 'temp_' + Date.now() };
    if (typeof window.createContent === 'function' && typeof window.v10SubjectForDb === 'function' && typeof window.v10UnitForDb === 'function') {
      const subj = window.v10SubjectForDb(subjectName);
      const unit = window.v10UnitForDb(unitId);
      
      savedData = await window.createContent('iq', {
        subjectId: subj.dbSubjectId || subj.id,
        unitId: unit.dbUnitId || unit.id,
        title: question.slice(0, 80),
        body: question,
        metadata: { priority, topicId, topicText: topicName }
      });
    }

    const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
    const iq = {
      id: savedData.id,
      dbContentId: savedData.id,
      question,
      priority,
      subject: subjectName,
      unit: unitId,
      topicId,
      topicName,
      uploadedAt: new Date().toLocaleString()
    };
    iqs.push(iq);
    localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs));
    
    if (typeof window.v10RefreshContentPane === 'function') {
      await window.v10RefreshContentPane('iq', subjectName, unitId);
    }
    if (typeof window.renderSubAdminDashboardLive === 'function') {
      window.renderSubAdminDashboardLive();
    }
    showToast('✅ Important question saved under topic.', 'green');
  } catch (err) {
    showToast('DB save failed: ' + err.message, 'red');
  } finally {
    isSavingIQ = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Save Important Question';
    }
  }
}

export async function v10DeleteIQ(id, subjectName, unitId) {
  if (!isCurrentSubjectOwned()) {
    showToast('You do not have write access to this subject.', 'red');
    return;
  }
  v11Confirm('Are you sure you want to delete this important question?', async () => {
    try {
      if (id && !String(id).startsWith('temp_')) {
        if (typeof window.deleteContent === 'function') {
          await window.deleteContent(id);
        }
      }
      const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
      localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs.filter(q => String(q.id) !== String(id) && String(q.dbContentId) !== String(id))));
      
      if (typeof window.v10RefreshContentPane === 'function') {
        await window.v10RefreshContentPane('iq', subjectName, unitId);
      }
      if (typeof window.renderSubAdminDashboardLive === 'function') {
        window.renderSubAdminDashboardLive();
      }
      showToast('Important question deleted successfully', 'green');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'red');
    }
  });
}
