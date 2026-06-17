export function toggleRoadmapSidebar() {
  const sidebar = document.getElementById('video-sidebar');
  const icon = document.getElementById('sidebar-toggle-icon');
  if (!sidebar) return;
  const isCollapsed = sidebar.classList.toggle('collapsed');
  if (icon) icon.textContent = isCollapsed ? '▶' : '◀';
  try {
    localStorage.setItem('edusync_roadmap_open', isCollapsed ? '0' : '1');
  } catch (e) { /* ignore */ }
}

export function restoreRoadmapSidebarState() {
  try {
    const open = localStorage.getItem('edusync_roadmap_open');
    if (open === '0') {
      const sidebar = document.getElementById('video-sidebar');
      const icon = document.getElementById('sidebar-toggle-icon');
      if (sidebar) sidebar.classList.add('collapsed');
      if (icon) icon.textContent = '▶';
    }
  } catch (e) { /* ignore */ }
}
