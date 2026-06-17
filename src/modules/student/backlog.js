import appState from '../../core/appState.js';
import { showToast } from '../../utils/helpers.js';

export function renderBacklog() {
  const grid = document.getElementById('backlog-grid');
  if (!grid) return;
  if (!appState.backlogSubjects.length) {
    grid.innerHTML = `<div class="backlog-empty">
      <div class="empty-icon">🎉</div>
      <h3>No Backlogs!</h3>
      <p>Great job! You have no backlog subjects. Keep maintaining your grades.</p>
    </div>`;
    return;
  }
  grid.innerHTML = `<div class="subject-grid">${appState.backlogSubjects.map((s, i) => `
    <div class="subject-card" onclick="window.openBacklogSubject('${s}')" style="animation-delay:${i * 0.07}s">
      <div class="subject-card-header" style="background:linear-gradient(135deg,var(--red-light),#fff);">
        <div class="subject-icon">⚠️</div>
        <div class="subject-name">${s}</div>
        <div class="subject-code">Backlog — Needs Attention</div>
      </div>
      <div class="subject-card-body">
        <div class="subject-meta">
          <span class="badge badge-red">Backlog</span>
          <span class="badge badge-primary">5 Units</span>
        </div>
        <div class="subject-progress-row">
          <span class="subject-progress-label">Completion</span>
          <span class="subject-progress-val" style="color:var(--red);">0%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:0%;background:var(--red);"></div></div>
      </div>
    </div>`).join('')}</div>`;
}

export function openBacklogSubject(name) {
  appState.currentSubject = { id: 'default', name, icon: '⚠️', credits: 3, progress: 0 };
  document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
  const unitsPage = document.getElementById('page-units');
  if (unitsPage) unitsPage.style.display = 'block';
  const unitsSubjName = document.getElementById('units-subject-name');
  if (unitsSubjName) unitsSubjName.textContent = `⚠️ ${name}`;
  const unitsTags = document.getElementById('units-tags');
  if (unitsTags) unitsTags.innerHTML = `<span class="badge badge-red">Backlog</span><span class="badge badge-primary">5 Units</span>`;
  const topbarTitle = document.getElementById('topbar-title');
  if (topbarTitle) topbarTitle.textContent = name;
  const topbarBreadcrumb = document.getElementById('topbar-breadcrumb');
  if (topbarBreadcrumb) topbarBreadcrumb.innerHTML = `Backlog / <span>${name}</span>`;
  if (typeof window.renderUnits === 'function') {
    window.renderUnits(appState.currentSubject);
  }
}

export function openSubjectFromRecent(id) {
  if (typeof window.navigateTo === 'function') {
    window.navigateTo('subjects');
  }
  setTimeout(() => {
    if (typeof window.openSubject === 'function') {
      window.openSubject(id);
    }
  }, 100);
  showToast('Opening recent activity...', 'blue');
}
