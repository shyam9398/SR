import appState from '../../core/appState.js';
import { showToast } from '../../utils/helpers.js';
import { selectVideoItem } from './selectVideo.js';

export function prevVideo() {
  if (appState.currentVideoIndex > 0) {
    selectVideoItem(appState.currentVideoIndex - 1);
    showToast('Previous video', 'blue');
  } else {
    showToast('This is the first video', 'amber');
  }
}
