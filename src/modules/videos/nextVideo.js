import appState from '../../core/appState.js';
import { showToast } from '../../utils/helpers.js';
import { selectVideoItem } from './selectVideo.js';

export function nextVideo() {
  const total = appState._videoItems?.length || 0;
  const item = appState._videoItems?.[appState.currentVideoIndex];
  const sid = appState.currentSubject?.id || 'os';
  const uid = appState.currentUnit || 1;
  const active = document.querySelector(`.video-item[data-topic-index="${item?.topicIndex ?? appState.currentVideoIndex}"]`);
  if (active) active.classList.add('completed');
  
  if (item) {
    if (typeof window.markTopicCompleted === 'function') {
      window.markTopicCompleted(sid, uid, item.topicIndex);
    }
    if (typeof window.syncTopicProgressToDb === 'function') {
      window.syncTopicProgressToDb({
        subjectId: sid,
        unitId: uid,
        topicIndex: item.topicIndex,
        topicId: item.id || item.topicId || null,
        status: 'completed'
      });
    }
  }

  if (appState.currentVideoIndex < total - 1) {
    selectVideoItem(appState.currentVideoIndex + 1);
    const selector = `.video-item[data-topic-index="${appState._videoItems?.[appState.currentVideoIndex]?.topicIndex ?? appState.currentVideoIndex}"]`;
    document.querySelector(selector)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    showToast('Progress saved', 'green');
  } else {
    showToast('Unit complete', 'green');
  }
}
