import appState from '../../core/appState.js';
import { supabase } from '../../services/supabase.service.js';
import { showToast } from '../../utils/helpers.js';
import { fetchSubjects, getSubjectProgress } from './subjects.service.js';
import { buildSemSwitcher } from './semesterSwitcher.js';

export async function renderSubjects(sem) {
  const grid = document.getElementById('subject-grid');
  if (grid) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text3);"><div style="font-size:3rem;margin-bottom:1rem;">⏳</div><div style="font-weight:700;font-size:1rem;">Loading subjects...</div></div>';
  }

  let sc = supabase || window.__AIMEASY_SUPABASE__;
  let wc = 0;
  while (!sc && wc < 5000) {
    await new Promise(r => setTimeout(r, 100));
    wc += 100;
    sc = supabase || window.__AIMEASY_SUPABASE__;
  }
  if (!sc) {
    if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;">⚠️ Connection error. Please refresh.</div>';
    return;
  }

  let session = null;
  let wa = 0;
  while (!session && wa < 8000) {
    try {
      const { data } = await sc.auth.getSession();
      session = data?.session;
    } catch (e) { }
    if (!session) {
      await new Promise(r => setTimeout(r, 250));
      wa += 250;
    }
  }

  let profile = null;
  if (session?.user?.id) {
    try {
      const { data: p } = await sc.from('profiles')
        .select('university_name,regulation_code,branch_name,branch,semester')
        .eq('id', session.user.id)
        .maybeSingle();
      profile = p;
    } catch (e) {
      console.warn('[Student] Profile load failed', e);
    }
  }

  const appUser = appState.user || {};
  const university_name = profile?.university_name || appUser.university_name || appUser.university || null;
  const branch = profile?.branch_name || profile?.branch || appUser.branch || appUser.branch_name || null;
  const regulation_code = profile?.regulation_code || appUser.regulation_code || appUser.regulation || null;

  const semester = sem
    || document.getElementById('sem-switcher')?.value
    || appUser.semester
    || profile?.semester
    || '1-1';

  let dbSubjects = [];
  const filters = { semester, university_name, branch, regulation_code };
  const { data, error } = await fetchSubjects(filters);
  if (!error && data) {
    dbSubjects = data;
  } else if (error) {
    console.error('[Student] fetchSubjects error', error);
  }

  if (!grid) return;
  const colorOptions = ['teal', 'lavender', 'blue', 'green', 'amber'];
  const iconOptions = ['📖', '🔬', '💡', '🖥️', '⚡', '🧮', '🔧', '📡'];
  const colorMap = { teal: 'var(--teal-light)', lavender: 'var(--lavender-light)', blue: 'var(--primary-light)', green: 'var(--green-light)', amber: 'var(--amber-light)' };
  const textMap = { teal: 'var(--teal)', lavender: 'var(--lavender)', blue: 'var(--primary)', green: 'var(--green)', amber: 'var(--amber)' };

  const meta = document.getElementById('subjects-meta');
  if (meta) meta.textContent = `Sem ${semester} · ${branch || 'Branch'} · ${university_name || 'University'} ${regulation_code || ''}`;

  if (!dbSubjects.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text3);"><div style="font-size:3rem;margin-bottom:1rem;">📚</div><div style="font-weight:700;font-size:1rem;margin-bottom:4px;">No subjects available yet</div><div style="font-size:0.83rem;">Sub Admin hasn't published subjects for Sem ${semester} yet.</div></div>`;
    return;
  }

  grid.innerHTML = dbSubjects.map((s, i) => {
    const subj = { id: 'custom_' + s.id, rawId: s.id, name: s.name, code: s.code || '', credits: parseInt(s.credits) || 3, units: 5, color: colorOptions[i % colorOptions.length], icon: iconOptions[i % iconOptions.length] };
    const progress = getSubjectProgress(subj);
    const bg = colorMap[subj.color] || colorMap.blue;
    const tx = textMap[subj.color] || textMap.blue;
    return `<div class="subject-card" onclick="openSubject('${subj.id}')" style="animation-delay:${i * 0.06}s">
      <div class="subject-card-header" style="background:linear-gradient(135deg,${bg},rgba(255,255,255,0.5));">
        <span style="position:absolute;top:8px;right:8px;font-size:0.65rem;background:var(--teal);color:#fff;padding:2px 7px;border-radius:50px;font-weight:700;">NEW</span>
        <div class="subject-icon">${subj.icon}</div>
        <div class="subject-name">${subj.name}</div>
        <div class="subject-code">${subj.code} · ${subj.credits} Credits</div>
      </div>
      <div class="subject-card-body">
        <div class="subject-meta">
          <span class="badge" style="background:${bg};color:${tx}">${subj.units} Units</span>
          <span class="badge badge-primary">${subj.credits} Cr</span>
        </div>
        <div class="subject-progress-row">
          <span class="subject-progress-label">Progress</span>
          <span class="subject-progress-val" style="color:${tx}">${progress}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%;background:linear-gradient(90deg,${tx},${bg});"></div></div>
      </div>
    </div>`;
  }).join('');
}
