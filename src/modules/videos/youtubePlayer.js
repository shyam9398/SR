import appState from '../../core/appState.js';

export function convertYouTubeToEmbed(url) {
  if (!url) return null;
  const videoIdMatch = String(url).match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/\s]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  console.log('[VIDEO] URL Parsed', { url, videoId });
  return videoId;
}

export function studentVideoResumeKey(item, idx) {
  const sid = appState.currentSubject?.id || 'default';
  const uid = appState.currentUnit || 1;
  return `student-video:${sid}:${uid}:${idx}:${item?.url || ''}`;
}

export function studentVideoStartSeconds(item, idx) {
  const key = studentVideoResumeKey(item, idx);
  return Math.max(0, Math.floor(Number(sessionStorage.getItem(key) || 0)));
}

export function storeStudentVideoPosition(item, idx, seconds) {
  if (!item?.url || !Number.isFinite(seconds)) return;
  sessionStorage.setItem(studentVideoResumeKey(item, idx), String(Math.max(0, Math.floor(seconds))));
}

export function ensureYouTubeIframeApi(callback) {
  if (window.YT?.Player) {
    callback();
    return;
  }
  const pending = window.__aimeasyYouTubeReadyCallbacks || [];
  pending.push(callback);
  window.__aimeasyYouTubeReadyCallbacks = pending;
  if (!document.getElementById('youtube-iframe-api')) {
    const script = document.createElement('script');
    script.id = 'youtube-iframe-api';
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  }
  const previousReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
    if (typeof previousReady === 'function') previousReady();
    const callbacks = window.__aimeasyYouTubeReadyCallbacks || [];
    window.__aimeasyYouTubeReadyCallbacks = [];
    callbacks.forEach(fn => fn());
  };
}

export function renderStudentYouTubeVideo(wrapper, item, idx, videoId, title) {
  const startSeconds = studentVideoStartSeconds(item, idx);
  wrapper.innerHTML = '<div id="student-video-player" style="width:100%;height:100%;border-radius:var(--radius-lg);overflow:hidden;"></div>';
  console.log('[VIDEO] Embed Created', { videoId, title, startSeconds });
  window.aimeasyStudentVideoPlayer = null;
  ensureYouTubeIframeApi(() => {
    const host = document.getElementById('student-video-player');
    if (!host) return;
    window.aimeasyStudentVideoPlayer = new YT.Player('student-video-player', {
      width: '100%',
      height: '100%',
      videoId,
      playerVars: {
        autoplay: 1,
        start: startSeconds,
        rel: 0,
      },
      events: {
        onReady(event) {
          if (startSeconds > 0) event.target.seekTo(startSeconds, true);
          event.target.playVideo();
          console.log('[VIDEO] Player Loaded', { videoId, title });
          console.log('[STUDENT] Video Loaded', { videoId, title });
        },
        onStateChange(event) {
          const player = event.target;
          if (player?.getCurrentTime) {
            storeStudentVideoPosition(item, idx, player.getCurrentTime());
          }
        }
      }
    });
  });
  const fallbackSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&start=${startSeconds}`;
  window.setTimeout(() => {
    const host = document.getElementById('student-video-player');
    if (host && !host.querySelector('iframe') && !window.aimeasyStudentVideoPlayer) {
      host.outerHTML = `<iframe id="student-video-player" width="100%" height="100%" src="${fallbackSrc}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:var(--radius-lg);"></iframe>`;
    }
  }, 1200);
}

export function aimeasySaveStudentVideoPosition() {
  const item = appState._videoItems?.[appState.currentVideoIndex];
  const player = window.aimeasyStudentVideoPlayer;
  if (item?.url && player?.getCurrentTime) {
    try {
      storeStudentVideoPosition(item, appState.currentVideoIndex, player.getCurrentTime());
    } catch (e) { }
  }
  try {
    player?.stopVideo?.();
    player?.destroy?.();
  } catch (e) { }
  window.aimeasyStudentVideoPlayer = null;
}
