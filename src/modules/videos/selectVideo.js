import appState from '../../core/appState.js';
import { recordStudyActivity, v10Esc } from '../../utils/helpers.js';
import { convertYouTubeToEmbed, renderStudentYouTubeVideo } from './youtubePlayer.js';
import { writeStudentUnitState } from './renderVideoList.js';

export function topicReviewKey(subjectId, unitId, topicIndex) {
  return `review:${subjectId}:${unitId}:${topicIndex}`;
}

export function selectVideoItem(idx) {
  appState.currentVideoIndex = idx;
  const item = appState._videoItems?.[idx];
  if (!item) return;

  document.querySelectorAll('.video-item').forEach(el => 
    el.classList.toggle('active', Number(el.dataset.topicIndex) === item.topicIndex)
  );

  writeStudentUnitState(appState.currentSubject?.id, appState.currentUnit, {
    videoIndex: idx,
    topicIndex: item.topicIndex,
    tab: appState.currentTab || 'videos'
  });

  if (typeof window.syncRoadmapNodeStates === 'function') {
    window.syncRoadmapNodeStates();
  }

  const displayTitle = item.title;
  const nowLabel = document.getElementById('now-playing-label');
  if (nowLabel) nowLabel.textContent = displayTitle;
  const topicTitleEl = document.getElementById('video-topic-title');
  if (topicTitleEl) topicTitleEl.textContent = displayTitle;

  const sid = appState.currentSubject?.id || 'os';
  const uid = appState.currentUnit || 1;
  recordStudyActivity('video_opened', {
    subjectId: sid,
    subjectName: appState.currentSubject?.name || '',
    unitId: uid,
    topicIndex: item.topicIndex
  });

  const reviewKey = topicReviewKey(sid, uid, item.topicIndex);
  const rb = document.getElementById('review-btn');
  if (rb) {
    const isReview = appState.markedReviews.has(reviewKey);
    rb.classList.toggle('marked', isReview);
    rb.textContent = isReview ? 'Marked for Review' : 'Mark for Review';
  }

  const wrapper = document.getElementById('video-embed-wrapper') || document.querySelector('.video-embed-wrapper');
  const descEl = document.getElementById('video-topic-desc');
  if (!wrapper) return;
  const url = item.url || '';
  const videoId = convertYouTubeToEmbed(url);

  if (videoId) {
    renderStudentYouTubeVideo(wrapper, item, idx, videoId, displayTitle);
    if (descEl) descEl.textContent = '';
    if (typeof window.renderTopicInlineNotes === 'function') {
      window.renderTopicInlineNotes(item.title, sid, uid, item.topicIndex);
    }
    if (typeof window.renderPendingUrls === 'function') {
      window.renderPendingUrls();
    }
    return;
  }

  if (url) {
    if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(url)) {
      wrapper.innerHTML = `<video src="${v10Esc(url)}" controls autoplay playsinline style="width:100%;height:100%;border-radius:var(--radius-lg);background:#000;"></video>`;
    } else {
      wrapper.innerHTML = `<iframe id="student-video-player" src="${v10Esc(url)}" frameborder="0" allowfullscreen style="width:100%;height:100%;border-radius:var(--radius-lg);"></iframe>`;
    }
    if (descEl) descEl.textContent = '';
    if (typeof window.renderTopicInlineNotes === 'function') {
      window.renderTopicInlineNotes(item.title, sid, uid, item.topicIndex);
    }
    if (typeof window.renderPendingUrls === 'function') {
      window.renderPendingUrls();
    }
    return;
  }

  wrapper.innerHTML = `<div class="video-placeholder"><div style="font-size:3.5rem;margin-bottom:4px;">Video</div><div style="opacity:0.75;font-size:0.95rem;color:#fff;margin-top:6px;">${v10Esc(displayTitle)}</div></div>`;
  if (descEl) descEl.textContent = 'Video coming soon.';
  if (typeof window.renderTopicInlineNotes === 'function') {
    window.renderTopicInlineNotes(item.title, sid, uid, item.topicIndex);
  }
  if (typeof window.renderPendingUrls === 'function') {
    window.renderPendingUrls();
  }
}

export function selectVideo(idx, title, subjectId, unitNum) {
  // Legacy selectVideo callback — simply delegates to selectVideoItem
  selectVideoItem(idx);
}
