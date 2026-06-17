import appState from '../../core/appState.js';
import { supabase } from '../../services/supabase.service.js';
import { v10Esc } from '../../utils/helpers.js';
import { getStudentAssignedSubjects, getSubjectProgress } from '../subjects/subjects.service.js';

export function weeklyStreakDots(current) {
  const active = Math.min(7, Number(current) || 0);
  return Array.from({ length: 7 }, (_, index) => `<span class="${index < active ? 'active' : ''}"></span>`).join('');
}

export function weeklyDashboardStats(subjects = []) {
  // Mock weekly activity for student progress tracker
  return {
    weeklyCompletion: subjects.length ? Math.round(subjects.reduce((sum, s) => sum + getSubjectProgress(s), 0) / subjects.length) : 0,
    unitsCompleted: 0,
    subjectsActive: subjects.filter(s => getSubjectProgress(s) > 0).length
  };
}

export async function statsLiveFromSupabase(created_by_subadmin_id = null) {
  if (!supabase) return {
    students: 0,
    users: 0,
    subjects: 0,
    branches: 0,
    semesters: 0,
    units: 0,
    topics: 0,
    videos: 0,
    notes: 0,
    pyqs: 0,
    iqs: 0,
    totalRegulations: 0,
    recentRegulations: []
  };

  if (created_by_subadmin_id) {
    try {
      const { data: mySubjects, error: subjectsErr } = await supabase
        .from('subjects')
        .select('id, branch, semester')
        .eq('created_by', created_by_subadmin_id);

      if (subjectsErr) throw subjectsErr;

      const subjectIds = (mySubjects || []).map(s => s.id);
      const subjectsCount = subjectIds.length;

      if (subjectsCount === 0) {
        return {
          students: 0,
          users: 0,
          creators: 0,
          subjects: 0,
          branches: 0,
          semesters: 0,
          units: 0,
          topics: 0,
          totalRegulations: 0,
          recentRegulations: [],
          videos: 0,
          notes: 0,
          pyqs: 0,
          iqs: 0
        };
      }

      const uniqueBranches = new Set(mySubjects.map(s => s.branch).filter(Boolean)).size;
      const uniqueSemesters = new Set(mySubjects.map(s => s.semester).filter(Boolean)).size;

      const { count: unitCount, error: unitsErr } = await supabase
        .from('units')
        .select('*', { count: 'exact', head: true })
        .in('subject_id', subjectIds);
      if (unitsErr) throw unitsErr;

      const { data: myTopics, error: topicsErr } = await supabase
        .from('topics')
        .select('id')
        .in('subject_id', subjectIds);
      if (topicsErr) throw topicsErr;

      const topicIds = (myTopics || []).map(t => t.id);
      const topicsCount = topicIds.length;

      let topicVideosCount = 0;
      if (topicIds.length > 0) {
        const { count, error: videosErr } = await supabase
          .from('topic_videos')
          .select('*', { count: 'exact', head: true })
          .in('topic_id', topicIds);
        if (videosErr) throw videosErr;
        topicVideosCount = count || 0;
      }

      const countContent = async (type) => {
        const { count, error } = await supabase
          .from('content_items')
          .select('*', { count: 'exact', head: true })
          .eq('content_type', type)
          .eq('created_by', created_by_subadmin_id);
        if (error) throw error;
        return Number(count || 0);
      };

      const [contentVideoCount, noteCount, pyqCount, iqCount] = await Promise.all([
        countContent('video'),
        countContent('note'),
        countContent('pyq'),
        countContent('iq')
      ]);

      return {
        students: 0,
        users: 0,
        creators: 0,
        subjects: subjectsCount,
        branches: uniqueBranches,
        semesters: uniqueSemesters,
        units: Number(unitCount || 0),
        topics: topicsCount,
        totalRegulations: 0,
        recentRegulations: [],
        videos: topicVideosCount + contentVideoCount,
        notes: noteCount,
        pyqs: pyqCount,
        iqs: iqCount
      };
    } catch (e) {
      console.warn('SubAdmin stats fetch failed:', e);
      return {
        students: 0,
        users: 0,
        creators: 0,
        subjects: 0,
        branches: 0,
        semesters: 0,
        units: 0,
        topics: 0,
        totalRegulations: 0,
        recentRegulations: [],
        videos: 0,
        notes: 0,
        pyqs: 0,
        iqs: 0
      };
    }
  }

  try {
    const { data: dashboardCounts, error: dashboardCountsError } = await supabase.rpc('get_dashboard_counts');
    if (dashboardCountsError) {
      console.warn('get_dashboard_counts failed:', dashboardCountsError.message);
    }
    const counts = Array.isArray(dashboardCounts) ? dashboardCounts[0] || {} : dashboardCounts || {};
    
    const countTable = async (table, apply) => {
      try {
        let query = supabase.from(table).select('*', { count: 'exact', head: true });
        if (typeof apply === 'function') query = apply(query);
        const { count, error } = await query;
        if (error) return 0;
        return Number(count || 0);
      } catch (e) {
        return 0;
      }
    };
    
    const distinctSubjectCount = async (column) => {
      try {
        const { data, error } = await supabase.from('subjects').select(column);
        if (error) return 0;
        return new Set((data || []).map(row => row?.[column]).filter(Boolean)).size;
      } catch (e) {
        return 0;
      }
    };

    const { count: regsCount } = await supabase
      .from('regulations')
      .select('*', { count: 'exact', head: true });

    const { data: recentRegRows } = await supabase
      .from('regulations')
      .select('id, regulation_name, regulation_code, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const [
      profileCount,
      roleProfileCount,
      subjectCount,
      branchCount,
      branchNameCount,
      semesterCount,
      unitCount,
      topicCount,
      topicVideoCount,
      contentVideoCount,
      noteCount,
      pyqCount,
      iqCount
    ] = await Promise.all([
      countTable('profiles'),
      countTable('role_profiles'),
      countTable('subjects'),
      countTable('branches'),
      distinctSubjectCount('branch'),
      distinctSubjectCount('semester'),
      countTable('units'),
      countTable('topics'),
      countTable('topic_videos'),
      countTable('content_items', q => q.eq('content_type', 'video')),
      countTable('content_items', q => q.eq('content_type', 'note')),
      countTable('content_items', q => q.eq('content_type', 'pyq')),
      countTable('content_items', q => q.eq('content_type', 'iq'))
    ]);

    const students = Number(counts.students || 0);
    const creators = Number(counts.creators || 0);
    const users = Number(counts.users || roleProfileCount || profileCount || students + creators || 0);

    return {
      students,
      users,
      creators,
      subjects: Number(counts.subjects || subjectCount || 0),
      branches: Number(counts.branches || branchCount || branchNameCount || 0),
      semesters: Number(counts.semesters || semesterCount || 0),
      units: unitCount,
      topics: topicCount,
      totalRegulations: Number(counts.regulations || regsCount || 0),
      recentRegulations: (recentRegRows || []).map(r => String(r.regulation_name || '').trim() || String(r.regulation_code || '').trim()).filter(Boolean),
      videos: topicVideoCount + contentVideoCount,
      notes: noteCount,
      pyqs: pyqCount,
      iqs: iqCount
    };
  } catch (err) {
    console.warn('Supabase stats fetch exception:', err);
    return {
      students: 0,
      users: 0,
      subjects: 0,
      branches: 0,
      semesters: 0,
      units: 0,
      topics: 0,
      videos: 0,
      notes: 0,
      pyqs: 0,
      iqs: 0,
      totalRegulations: 0,
      recentRegulations: []
    };
  }
}

function statCards(items) {
  return items.map(([label, value, color]) => `
    <div class="admin-stat-card">
      <div class="admin-stat-accent" style="background:${color};"></div>
      <div style="font-size:2.3rem;font-weight:800;color:${color};">${v10Esc(value)}</div>
      <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">${v10Esc(label)}</div>
      <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">Real records only</div>
    </div>`).join('');
}

export async function renderAdminDashboardLive() {
  const content = document.getElementById('admin-content');
  if (!content) return;

  content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <div style="margin-bottom:1.6rem;">
        <h2 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">Admin Dashboard</h2>
        <p style="font-size:0.84rem;color:var(--text3);">Loading live metrics from Supabase...</p>
      </div>
    </div>`;

  const s = await statsLiveFromSupabase();

  content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <div style="margin-bottom:1.6rem;">
        <h2 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">Admin Dashboard</h2>
        <p style="font-size:0.84rem;color:var(--text3);">Supabase is the only source of truth.</p>
      </div>
      <div class="admin-grid" style="margin-bottom:2rem;">
        ${statCards([
          ['Total Students', s.students, 'var(--primary)'],
          ['Total Users', s.users, 'var(--green)'],
          ['Total Content Creators', s.creators, 'var(--teal)'],
          ['Total Subjects', s.subjects, 'var(--lavender)'],
          ['Total Branches', s.branches, 'var(--blue)'],
          ['Total Semesters', s.semesters, 'var(--red)'],
          ['Total Units', s.units, 'var(--teal)'],
          ['Total Topics', s.topics, 'var(--primary)'],
          ['Total Videos', s.videos, 'var(--blue)'],
          ['Total Notes', s.notes, 'var(--amber)'],
          ['Total PYQs', s.pyqs, 'var(--green)'],
          ['Total Regulations', s.totalRegulations, 'var(--amber)'],
        ])}
      </div>
    </div>`;
}

export async function renderSubAdminDashboardLive() {
  const content = document.getElementById('sa-content');
  if (!content) return;
  const sa = appState.subAdminData || {};
  const s = await statsLiveFromSupabase(sa.username);
  
  content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <div style="margin-bottom:1.6rem;">
        <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">Sub Admin Dashboard</h2>
        <p style="font-size:0.82rem;color:var(--text3);">${v10Esc(sa.branch || 'Content Management')}</p>
      </div>
      <div class="admin-grid" style="margin-bottom:1.6rem;">
        ${statCards([
          ['Total Subjects', s.subjects, 'var(--primary)'],
          ['Total Units', s.units, 'var(--teal)'],
          ['Total Topics', s.topics, 'var(--lavender)'],
          ['Total Videos', s.videos, 'var(--blue)'],
          ['Total Notes', s.notes, 'var(--amber)'],
          ['Total PYQs', s.pyqs, 'var(--green)']
        ])}
      </div>
    </div>`;
}

export function updateStudentDashboardMetrics() {
  const calcdSems = appState.calcSemesters ? appState.calcSemesters.filter(s => s.sgpa !== null) : [];
  let cgpa = 0.0;
  if (calcdSems.length > 0) {
    cgpa = calcdSems.reduce((s, x) => s + x.sgpa, 0) / calcdSems.length;
  }

  updateStudyStreak();
  const subjects = getStudentAssignedSubjects();
  const weekly = weeklyDashboardStats(subjects);

  const metricVals = document.querySelectorAll('#page-dashboard .metric-card .metric-val');
  if (metricVals.length >= 3) {
    metricVals[0].textContent = cgpa > 0 ? cgpa.toFixed(2) : '0';
    const avgProgress = subjects.length
      ? Math.round(subjects.reduce((sum, s) => sum + getSubjectProgress(s), 0) / subjects.length)
      : 0;
    metricVals[1].textContent = avgProgress + '%';

    const streak = parseInt(localStorage.getItem('edusync_streak') || '0');
    metricVals[2].textContent = String(streak);
  }

  const trendEl = document.querySelector('#page-dashboard .metric-card.blue .metric-trend');
  if (trendEl) {
    if (calcdSems.length > 1) {
      const prevSems = calcdSems.slice(0, -1);
      const prevCgpa = prevSems.reduce((s, x) => s + x.sgpa, 0) / prevSems.length;
      const diff = cgpa - prevCgpa;
      const arrow = diff >= 0 ? '↑' : '↓';
      trendEl.textContent = `${arrow} ${Math.abs(diff).toFixed(2)} from last sem`;
    } else {
      trendEl.textContent = '↑ 0.0 from last sem';
    }
  }

  const streakEl = document.getElementById('study-streak-current');
  if (streakEl) streakEl.textContent = `${localStorage.getItem('edusync_streak') || '0'} 🔥`;
  
  const streakMeta = document.getElementById('study-streak-meta');
  if (streakMeta) {
    const best = localStorage.getItem('edusync_best_streak') || '0';
    const last = localStorage.getItem('edusync_last_active_date') || 'Never';
    streakMeta.textContent = `Best Streak: ${best} · Last Active: ${last}`;
  }

  const card = document.querySelector('#page-dashboard .streak-card');
  if (card) {
    const current = localStorage.getItem('edusync_streak') || '0';
    const best = localStorage.getItem('edusync_best_streak') || '0';
    const last = localStorage.getItem('edusync_last_active_date') || 'Never';
    card.innerHTML = `
      <div class="compact-streak-card">
        <div>
          <div class="compact-kicker">Current Streak</div>
          <div class="compact-streak-value">${v10Esc(current)} days</div>
        </div>
        <div class="compact-streak-meta">
          <span>Best: <strong>${v10Esc(best)}</strong></span>
          <span>Last active: <strong>${v10Esc(last)}</strong></span>
        </div>
        <div class="streak-week">${weeklyStreakDots(current)}</div>
      </div>`;
  }

  const progressTracker = document.querySelector('#page-dashboard .progress-tracker');
  if (progressTracker) {
    progressTracker.innerHTML = `
      <div class="section-heading">Weekly Progress</div>
      <div class="weekly-summary">
        <div><strong>${weekly.weeklyCompletion}%</strong><span>Weekly Completion</span></div>
        <div><strong>${weekly.unitsCompleted}</strong><span>Units Completed This Week</span></div>
        <div><strong>${weekly.subjectsActive}</strong><span>Subjects Active This Week</span></div>
      </div>
    `;
  }
}
