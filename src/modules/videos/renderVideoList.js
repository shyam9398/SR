import appState from '../../core/appState.js';
import { fetchUnitRoadmap } from '../roadmap/roadmap.service.js';
import { fetchApprovedTopicSuggestions } from './video.service.js';
import { selectVideoItem } from './selectVideo.js';
import { selectTopicUrl } from '../roadmap/topicNotes.js';

export function readStudentUnitState(subjectId, unitNum) {
  try {
    const key = `edusync_state:${subjectId}:${unitNum}`;
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

export function writeStudentUnitState(subjectId, unitNum, state) {
  try {
    const key = `edusync_state:${subjectId}:${unitNum}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

export function hydrateMarkedReviews() {
  try {
    const list = JSON.parse(localStorage.getItem('edusync_marked_reviews') || '[]');
    appState.markedReviews = new Set(list);
  } catch {
    appState.markedReviews = new Set();
  }
}

export async function renderVideoList(subjectId, unitNum) {
  let roadmapTopics = [];
  let roadmapContext = null;
  if (subjectId) {
    const dbSubject = appState.currentSubject;
    if (dbSubject) {
      const { data, error } = await fetchUnitRoadmap({
        subject: dbSubject,
        unit: { id: unitNum, name: `Unit ${unitNum}` },
      });
      if (error) {
        console.warn('[STUDENT] Roadmap Failed', error);
      } else {
        roadmapTopics = data?.topics || [];
        roadmapContext = data || null;
      }
    }
  }

  const list = document.getElementById('video-list');
  if (!list) return;
  hydrateMarkedReviews();
  
  const unitState = readStudentUnitState(appState.currentSubject?.id || subjectId, unitNum);
  appState.currentVideoIndex = Math.max(0, Number(unitState.videoIndex || 0));
  appState._videoItems = [];

  const approvedSuggestions = await fetchApprovedTopicSuggestions(roadmapContext?.subjectId, roadmapContext?.unitId);
  const suggestionsByTopic = approvedSuggestions.reduce((map, row) => {
    const key = String(row.topic_id || '');
    if (!key) return map;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
    return map;
  }, new Map());

  const groupedHtml = roadmapTopics.map((topic, topicIndex) => {
    const topicTitle = topic.topicName || topic.name || `Topic ${topicIndex + 1}`;
    const adminVideos = Array.isArray(topic.videos) && topic.videos.length
      ? topic.videos
      : (topic.youtubeUrls || topic.urls || []).map((url) => ({ url, description: '' }));
    const suggestedVideos = (suggestionsByTopic.get(String(topic.id || topic.dbContentId || '')) || []).map((row) => ({
      id: row.id,
      url: row.url,
      title: row.title || 'Suggested URL',
      description: row.description || '',
      source: 'suggestion',
    }));
    const sourceVideos = [...adminVideos, ...suggestedVideos]
      .map((video) => ({
        id: video.id || video.dbContentId || '',
        url: (video.url || video.youtubeUrl || '').trim(),
        title: video.title || video.description || topicTitle,
        description: video.description || '',
        source: video.source || 'admin',
      }))
      .filter((video) => video.url || video.description);
    const displayVideos = sourceVideos.length ? sourceVideos : [{ url: '', title: topicTitle, description: '', source: 'admin' }];
    const baseIndex = appState._videoItems.length;
    displayVideos.forEach((video, videoIndex) => appState._videoItems.push({
      type: video.source === 'suggestion' ? 'suggested' : 'roadmap',
      id: topic.id || topic.dbContentId || '',
      topicId: topic.id || topic.dbContentId || '',
      suggestionId: video.source === 'suggestion' ? video.id : '',
      title: topicTitle,
      url: video.url,
      description: video.description || '',
      topicIndex,
      videoIndex,
    }));
    
    const extraButtons = displayVideos.length > 1 ? `<div class="video-item-extras">${displayVideos.map((video, videoIndex) => {
      const label = video.source === 'suggestion' ? `Suggested ${videoIndex}` : `Video ${videoIndex + 1}`;
      return `<button type="button" class="video-extra-btn" onclick="event.stopPropagation(); window.selectTopicUrl(${topicIndex},${videoIndex})">${v10Esc(label)}</button>`;
    }).join('')}</div>` : '';
    const hasApproved = displayVideos.some((video) => video.source === 'suggestion');
    return `<button type="button" class="video-item ${topicIndex === appState.currentVideoIndex ? 'active' : ''}" data-topic-index="${topicIndex}" onclick="window.selectVideoItem(${baseIndex})">
      <div class="video-connector"></div>
      <div class="video-item-dot">${topicIndex + 1}</div>
      <div class="video-item-info">
        <div class="video-item-title">${v10Esc(topicTitle)}${hasApproved ? ' <span class="badge badge-green">Suggested URLs</span>' : ''}</div>
        ${extraButtons}
      </div>
    </button>`;
  }).join('');

  list.innerHTML = groupedHtml;
  if (appState._videoItems.length) {
    const restoredIndex = Math.min(appState.currentVideoIndex, appState._videoItems.length - 1);
    selectVideoItem(restoredIndex);
    const restoredTab = unitState.tab || appState.currentTab;
    if (restoredTab && restoredTab !== 'videos' && typeof window.switchTab === 'function') {
      window.setTimeout(() => window.switchTab(restoredTab), 0);
    }
  } else {
    const wrapper = document.getElementById('video-embed-wrapper') || document.querySelector('.video-embed-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `<div class="video-placeholder"><div style="font-size:3.5rem;margin-bottom:4px;">Video</div><div style="opacity:0.75;font-size:0.95rem;color:#fff;">No roadmap available yet</div><div style="font-size:0.8rem;opacity:0.6;margin-top:1rem;">SubAdmin has not saved roadmap videos for this unit</div></div>`;
    }
    const descEl = document.getElementById('video-topic-desc');
    if (descEl) descEl.textContent = 'No roadmap records are saved for this subject and unit yet.';
  }
}
