import appState from '../../core/appState.js';
import { stopVideoPlayer } from '../../services/media/stopVideoPlayer.js';
import { supabase } from '../../services/supabase.service.js';
import { selectVideoItem } from './selectVideo.js';
import { showToast } from '../../utils/helpers.js';

export { stopVideoPlayer };

export async function fetchApprovedTopicSuggestions(subjectId, unitId) {
  if (!supabase || !subjectId || !unitId) return [];
  try {
    const { data, error } = await supabase
      .from('student_url_suggestions')
      .select('id, title, url, description, subject_id, unit_id, topic_id, status, created_at')
      .eq('subject_id', subjectId)
      .eq('unit_id', unitId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });
    if (error) {
      console.warn('[SUGGESTIONS] Approved URL load failed:', error.message || error);
      return [];
    }
    return data || [];
  } catch (e) {
    return [];
  }
}

export function aimeasyResumeStudentVideo() {
  const item = appState._videoItems?.[appState.currentVideoIndex];
  if (item?.url) {
    selectVideoItem(appState.currentVideoIndex);
  }
}

export function playCurrentVideo() {
  const item = appState._videoItems?.[appState.currentVideoIndex];
  if (item?.url) {
    if (typeof window.openApprovedVideo === 'function') {
      window.openApprovedVideo(item.url);
    } else {
      window.open(item.url, '_blank');
    }
  } else {
    showToast('▶ This topic has no video URL yet. Sub admin can add one!', 'blue');
  }
}
