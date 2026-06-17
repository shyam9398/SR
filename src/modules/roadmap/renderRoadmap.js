import appState from '../../core/appState.js';
import { v10Esc } from '../../utils/helpers.js';

function isCurrentSubjectOwned() {
  const currentSubj = appState.currentSubject || window._v10SASubj;
  if (!currentSubj) return true;
  const sa = appState.subAdminData || {};
  if (!sa.username) return true;
  if (appState.adminType === 'admin') return true;
  return currentSubj.created_by === sa.username;
}

export function v10TopicRowHTML(subjId, unitId, idx, name, urls, total, topicId = '') {
  const isFilled = name.trim() !== '';
  const videos = (Array.isArray(urls) && urls.length ? urls : ['']).map((item) => (
    typeof item === 'object'
      ? { url: item.url || item.youtubeUrl || '', description: item.description || '' }
      : { url: item || '', description: '' }
  ));
  const video = videos[0] || { url: '', description: '' };
  const isOwner = isCurrentSubjectOwned();

  return `
  <div class="v10-topic-row" id="v10-tr-${unitId}-${idx}" data-topic-id="${topicId}" style="display:flex; flex-direction:column; gap:12px; padding:16px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--surface); margin-bottom:12px; position:relative;">
    <div style="display:flex; align-items:center; gap:8px;">
      <div class="v10-dot ${isFilled ? 'filled' : ''}" id="v10-dot-${unitId}-${idx}" style="width:24px; height:24px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:700;">${idx + 1}</div>
      <h5 style="margin:0; font-size:.85rem; font-weight:600; color:var(--text1);">Topic Node #${idx + 1}</h5>
      ${isOwner ? `<button type="button" class="v10-rm-btn" onclick="window.v10RemoveTopic('${unitId}',${idx})" title="Remove" style="margin-left:auto; background:none; border:none; cursor:pointer; color:var(--red); font-size:1.1rem; font-weight:700;">✕</button>` : ''}
    </div>
    <div class="v10-topic-fields" style="display:flex; flex-direction:column; gap:8px;">
      <div class="input-group">
        <span class="v10-label" style="font-size:0.72rem; color:var(--text3); font-weight:600; text-transform:uppercase;">Topic Name *</span>
        <input class="input ${isFilled ? 'filled' : ''}" placeholder="Topic name (e.g. Introduction to AI)" value="${name.replace(/"/g, '&quot;')}" oninput="window.v10DotUpdate('${unitId}',${idx},this.value)" required style="width:100%;" ${isOwner ? '' : 'disabled'} />
      </div>
      <div class="v10-url-list">
        <div class="v10-url-row" style="display:flex; flex-direction:column; gap:8px;">
          <div class="input-group">
            <span class="v10-label" style="font-size:0.72rem; color:var(--text3); font-weight:600; text-transform:uppercase;">Video URL *</span>
            <input class="v10-url-input input" placeholder="Video URL" value="${(video.url || '').replace(/"/g, '&quot;')}" required style="width:100%;" ${isOwner ? '' : 'disabled'} />
          </div>
          <div class="input-group">
            <span class="v10-label" style="font-size:0.72rem; color:var(--text3); font-weight:600; text-transform:uppercase;">Description (Optional)</span>
            <textarea class="v10-video-desc-input input" placeholder="Description..." rows="2" style="width:100%; resize:vertical;" ${isOwner ? '' : 'disabled'}>${(video.description || '').replace(/"/g, '&quot;')}</textarea>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

export function v10SavedRoadmapTree(topics, subjId, unitId) {
  const list = Array.isArray(topics) ? topics : [];
  if (!list.length) return '<div class="v10-saved-roadmap-empty" style="text-align:center;padding:2rem;color:var(--text3);">Saved roadmap will appear here as a flow diagram.</div>';
  
  list.sort((a, b) => Number(a.displayOrder || a.display_order || 0) - Number(b.displayOrder || b.display_order || 0));
  const isOwner = isCurrentSubjectOwned();

  return `
  <div class="v10-saved-roadmap">
    <div class="v10-items-head" style="margin-bottom:12px;font-weight:700;">Saved Roadmap Flow (${list.length})</div>
    <div class="roadmap-flow-container" style="display:flex; flex-direction:column; align-items:center; gap:16px; padding:20px; background:var(--surface2); border-radius:var(--radius-lg); border:1.5px solid var(--border);">
      ${list.map((topic, ti) => {
        const topicName = topic.name || topic.topicName || `Topic ${ti + 1}`;
        const videos = Array.isArray(topic.videos) && topic.videos.length
          ? topic.videos
          : (topic.youtubeUrls || topic.urls || []).map((url) => ({ url, description: '' }));
        const video = videos[0] || { url: '', description: '' };
        const videoUrl = video.url || topic.youtubeUrl || topic.url || '';
        const videoDesc = video.description || topic.description || '';

        const arrowHtml = ti > 0 ? `
          <div class="roadmap-connector" style="display:flex; align-items:center; justify-content:center; height:32px; width:100%;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          </div>
        ` : '';

        return arrowHtml + `
          <div class="v10-saved-topic roadmap-node" data-topic-id="${topic.id}" style="position:relative; width:100%; max-width:400px; padding:18px; background:var(--surface); border:2px solid var(--primary); border-radius:var(--radius-md); box-shadow:var(--shadow-sm); display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <h4 style="margin:0; font-size:0.95rem; color:var(--primary); font-weight:700;">${v10Esc(topicName)}</h4>
              ${isOwner ? `
              <div class="v10-dot-wrap" style="position:relative;" onclick="event.stopPropagation()">
                <button class="v10-dot-btn" onclick="window.v10OpenTopicMenuDb(this,'${subjId}','${unitId}','${topic.id}',${ti},${list.length})" title="Topic Options" style="padding:2px 6px;font-size:1.1rem;background:transparent;border:none;cursor:pointer;color:var(--text3);">⋮</button>
              </div>` : ''}
            </div>
            ${videoDesc ? `<p style="margin:0; font-size:0.8rem; color:var(--text2); line-height:1.4;">${v10Esc(videoDesc)}</p>` : ''}
            ${videoUrl ? `
              <a href="${v10Esc(videoUrl)}" target="_blank" rel="noopener" class="btn btn-teal btn-sm" style="display:inline-flex; align-items:center; justify-content:center; text-decoration:none; font-size:0.78rem; font-weight:600; gap:4px; padding:6px 12px; margin-top:4px; width:fit-content;">Open URL ↗</a>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  </div>
  `;
}

export function v10RoadmapPanel(subjId, unitId, topics) {
  const list = Array.isArray(topics) ? topics : [];
  const isOwner = isCurrentSubjectOwned();
  const rows = list.length ? list.map((t, i) => v10TopicRowHTML(
    subjId,
    unitId,
    i,
    t.name || t.topicName || '',
    Array.isArray(t.videos) && t.videos.length
      ? t.videos
      : (Array.isArray(t.youtubeUrls) ? t.youtubeUrls : (t.youtubeUrl || t.url ? [t.youtubeUrl || t.url] : [''])),
    list.length,
    t.id || ''
  )).join('')
    : `<div id="v10-rm-empty-${unitId}" style="text-align:center;padding:1.8rem;color:var(--text3);">
        <div style="font-weight:600;font-size:.88rem;">No topics yet</div>
        <div style="font-size:.76rem;margin-top:4px;">${isOwner ? 'Click "+ Add Topic" to build the roadmap' : 'No topics have been added to this roadmap yet.'}</div>
       </div>`;

  return `
  <div class="v10-panel">
    <div class="v10-panel-head">
      <h4>Learning Roadmap</h4>
      <div class="v10-panel-actions">
        ${isOwner ? `<button class="btn btn-primary btn-sm" onclick="window.v10AddTopic('${subjId}','${unitId}')">+ Add Topic</button>` : ''}
      </div>
    </div>
    <div class="v10-panel-body">
      <div id="v10-topics-${unitId}">${rows}</div>
      ${isOwner ? `<button class="v10-submit" onclick="window.v10SaveRoadmap('${subjId}','${unitId}')">Save Learning Roadmap</button>` : ''}
      <div id="v10-saved-roadmap-${unitId}" style="margin-top:1rem;">${v10SavedRoadmapTree(list, subjId, unitId)}</div>
    </div>
  </div>`;
}
