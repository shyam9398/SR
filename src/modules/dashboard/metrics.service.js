import appState from '../../core/appState.js';
import { resolveAppUser } from '../auth/session.service.js';

export function updateDashGreeting() {
  const user = resolveAppUser();
  const greetEl = document.getElementById('dash-greeting-text');
  if (!user || !greetEl) return;
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user.name?.split(' ')[0] || 'Student';
  greetEl.textContent = `${greet}, ${firstName}! 👋`;
}

export function updateSidebarProfile() {
  const user = resolveAppUser();
  if (!user) return;
  const name = user.name || 'Student';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const av = document.getElementById('sidebar-avatar');
  if (!av) return;
  if (user.photo) {
    av.innerHTML = `<img src="${user.photo}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  } else {
    av.textContent = initials;
  }
  const nameEl = document.getElementById('sidebar-name');
  const infoEl = document.getElementById('sidebar-info');
  if (nameEl) nameEl.textContent = name.split(' ')[0];
  const yearVal = String(user.year || '');
  const yr = yearVal
    ? yearVal + (yearVal === '1' ? 'st' : yearVal === '2' ? 'nd' : yearVal === '3' ? 'rd' : 'th') + ' Year'
    : '';
  const branch = user.branch || user.branch_name || '';
  if (infoEl) infoEl.textContent = branch && yr ? `${branch} · ${yr}` : branch || yr || '';
  updateDashGreeting();
}

export function buildHeatmap() {
  const hm = document.getElementById('heatmap');
  if (!hm) return;
  hm.innerHTML = ''; // Clear to prevent duplicates on navigation
  const intensities = ['', 'h1', 'h2', 'h3', 'h4'];
  for (let i = 0; i < 91; i++) {
    const cell = document.createElement('div');
    const r = Math.random();
    cell.className = 'heatmap-cell ' + (i > 77 ? intensities[3 + Math.floor(r * 2)] : r > 0.4 ? intensities[1 + Math.floor(r * 3)] : '');
    cell.style.animationDelay = (i * 8) + 'ms';
    cell.style.animation = `heatmap-appear 0.3s ease ${i * 6}ms both`;
    cell.title = `Day ${i + 1}`;
    hm.appendChild(cell);
  }
}
