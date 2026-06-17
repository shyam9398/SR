import { showToast, v11Confirm } from '../../utils/helpers.js';

function isCurrentSubjectOwned() {
  const currentSubj = window.APP?.currentSubject || window._v10SASubj;
  if (!currentSubj) return true;
  const sa = window.APP?.subAdminData || {};
  if (!sa.username) return true;
  if (window.APP?.adminType === 'admin') return true;
  return currentSubj.created_by === sa.username;
}

let isSavingPYQ = false;
export async function v10UploadPYQ(subjectName, unitId) {
  if (isSavingPYQ) return;
  if (!isCurrentSubjectOwned()) {
    showToast('You do not have write access to this subject.', 'red');
    return;
  }
  const form = document.querySelector(`#v10-pyq-${unitId} .v10-form`);
  const btn = form?.querySelector('.v10-submit');

  const question = document.getElementById('v10-pyqtxt-' + unitId)?.value.trim();
  const year = document.getElementById('v10-pyqyr-' + unitId)?.value;
  const marks = document.getElementById('v10-pyqmarks-' + unitId)?.value;
  
  let topicId = '', topicName = '';
  if (typeof window.v10ReadTopicInput === 'function') {
    const topicInfo = window.v10ReadTopicInput(unitId, 'pyq');
    topicId = topicInfo.topicId;
    topicName = topicInfo.topicName;
  } else {
    topicName = document.getElementById(`v10-pyq-topic-text-${unitId}`)?.value.trim() || '';
  }

  if (!topicName) { showToast('Enter topic text or select a topic', 'red'); return; }
  if (!question) { showToast('Enter question', 'red'); return; }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }
  isSavingPYQ = true;

  try {
    let savedData = { id: 'temp_' + Date.now() };
    if (typeof window.createContent === 'function' && typeof window.v10SubjectForDb === 'function' && typeof window.v10UnitForDb === 'function') {
      const subj = window.v10SubjectForDb(subjectName);
      const unit = window.v10UnitForDb(unitId);
      
      savedData = await window.createContent('pyq', {
        subjectId: subj.dbSubjectId || subj.id,
        unitId: unit.dbUnitId || unit.id,
        title: question.slice(0, 80),
        body: question,
        metadata: { year, marks, topicId, topicText: topicName }
      });
    }

    const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
    const pyq = {
      id: savedData.id,
      dbContentId: savedData.id,
      question,
      year,
      marks,
      subject: subjectName,
      unit: unitId,
      topicId,
      topicName
    };
    pyqs.push(pyq);
    localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs));
    
    if (typeof window.v10RefreshContentPane === 'function') {
      await window.v10RefreshContentPane('pyq', subjectName, unitId);
    }
    if (typeof window.renderSubAdminDashboardLive === 'function') {
      window.renderSubAdminDashboardLive();
    }
    showToast('✅ PYQ saved under topic.', 'green');
  } catch (err) {
    showToast('DB save failed: ' + err.message, 'red');
  } finally {
    isSavingPYQ = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Save PYQ';
    }
  }
}

export async function v10DeletePYQ(id, subjectName, unitId) {
  if (!isCurrentSubjectOwned()) {
    showToast('You do not have write access to this subject.', 'red');
    return;
  }
  v11Confirm('Are you sure you want to delete this PYQ?', async () => {
    try {
      if (id && !String(id).startsWith('temp_')) {
        if (typeof window.deleteContent === 'function') {
          await window.deleteContent(id);
        }
      }
      const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
      localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs.filter(p => String(p.id) !== String(id) && String(p.dbContentId) !== String(id))));
      
      if (typeof window.v10RefreshContentPane === 'function') {
        await window.v10RefreshContentPane('pyq', subjectName, unitId);
      }
      if (typeof window.renderSubAdminDashboardLive === 'function') {
        window.renderSubAdminDashboardLive();
      }
      showToast('PYQ deleted successfully', 'green');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'red');
    }
  });
}
