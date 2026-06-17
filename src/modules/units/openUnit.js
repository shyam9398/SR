import appState from '../../core/appState.js';
import { recordStudyActivity, v10Esc } from '../../utils/helpers.js';
import { renderVideoList } from '../videos/renderVideoList.js';

export function openUnit(unitNum, subjectId) {
  appState.currentUnit = unitNum;
  recordStudyActivity('unit_opened', {
    subjectId: subjectId || appState.currentSubject?.id || '',
    subjectName: appState.currentSubject?.name || '',
    unitId: unitNum
  });

  if (typeof window.navigateTo === 'function') {
    window.navigateTo('unit-content');
  } else {
    document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
    const pageContent = document.getElementById('page-unit-content');
    if (pageContent) pageContent.style.display = 'block';
  }

  const subj = appState.currentSubject;
  const subjectName = subj?.name || 'Subject';

  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });

  const titleEl = document.getElementById('unit-content-title');
  if (titleEl) titleEl.textContent = `${subj?.icon || '📚'} Unit ${unitNum} — ${subjectName}`;
  const subEl = document.getElementById('unit-content-sub');
  if (subEl) subEl.textContent = `Explore Roadmap, Notes, and PYQs`;
  const topbarTitleEl = document.getElementById('topbar-title');
  if (topbarTitleEl) topbarTitleEl.textContent = `Unit ${unitNum}`;
  const topbarBreadcrumbEl = document.getElementById('topbar-breadcrumb');
  if (topbarBreadcrumbEl) topbarBreadcrumbEl.innerHTML = `${subjectName} / <span>Unit ${unitNum}</span>`;

  const displayUnit = window.aimeasyUnitLabel ? window.aimeasyUnitLabel(unitNum) : `Unit - ${unitNum}`;

  // Call child renderers
  renderVideoList(subj?.id || subj?.rawId || subj, unitNum);
  
  if (typeof window.renderNotes === 'function') window.renderNotes(subj?.id || subj?.rawId || subj, unitNum);
  if (typeof window.renderPYQ === 'function') window.renderPYQ(subj?.id || subj?.rawId || subj, unitNum);
  if (typeof window.renderIQ === 'function') window.renderIQ(subj?.id || subj?.rawId || subj, unitNum);

  // Dynamic modules hook
  if (typeof window.v10Features === 'function' && typeof window.v10Slug === 'function' && typeof window.v10DynamicItems === 'function') {
    const features = window.v10Features();
    const legacySlugs = new Set(['videos', 'notes', 'pyqs', 'important-questions']);
    const tabs = document.querySelector('#page-unit-content .content-tabs');
    if (subj && tabs) {
      features.forEach(feature => {
        const key = window.v10Slug(feature);
        if (legacySlugs.has(key)) return;
        document.getElementById('tab-btn-dyn-' + key)?.remove();
        document.getElementById('tab-dyn-' + key)?.remove();
        tabs.insertAdjacentHTML('beforeend', `<button class="content-tab" id="tab-btn-dyn-${key}" onclick="switchTab('dyn-${key}')">${v10Esc(feature)}</button>`);
        
        let dynamicItemsHtml = '';
        const items = window.v10DynamicItems(feature, subj.name, unitNum);
        if (items.length) {
          dynamicItemsHtml = items.map(item => `
            <div class="v10-item">
              <span style="font-size:1.1rem;">*</span>
              <div class="v10-item-body">
                <div class="v10-item-title">${v10Esc(item.title)}</div>
                ${item.description ? `<div class="v10-item-meta">${v10Esc(item.description)}</div>` : ''}
                ${item.link ? `<a href="${v10Esc(item.link)}" target="_blank" rel="noopener" style="font-size:.78rem;color:var(--primary);word-break:break-all;">${v10Esc(item.link)}</a>` : ''}
              </div>
            </div>`).join('');
        } else {
          dynamicItemsHtml = `<div style="text-align:center;padding:2rem;color:var(--text3);">No ${v10Esc(feature)} available yet.</div>`;
        }
        
        document.getElementById('page-unit-content').insertAdjacentHTML('beforeend', `<div class="tab-pane" id="tab-dyn-${key}"><div class="v10-items">${dynamicItemsHtml}</div></div>`);
      });
    }
  }

  // Switch to first tab by default
  const firstTab = document.querySelector('#page-unit-content .content-tab');
  if (firstTab) firstTab.click();
}
