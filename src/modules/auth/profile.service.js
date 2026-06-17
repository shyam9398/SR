import appState from '../../core/appState.js';
import { showToast, showLoading, hideLoading } from '../../utils/helpers.js';
import { normalizeRole, ROLE, applyDashboardRedirect } from '../../services/auth/roleRedirectService.js';
import {
  isCreatorProfileComplete,
  isProfileAcademicComplete,
  isProfileFullyComplete,
  isProfilePersonalComplete,
  profileToLegacyUser,
  upsertProfileFromLegacy,
  clearLoginPortal,
} from '../../services/auth/profileService.js';
import { setCurrentBranch } from '../../services/auth/branchContext.js';

export {
  isCreatorProfileComplete,
  isProfileAcademicComplete,
  isProfileFullyComplete,
  isProfilePersonalComplete,
  profileToLegacyUser,
  upsertProfileFromLegacy,
};

export function cleanHashUrl(path) {
  return `${window.location.pathname}#${path}`;
}

export function syncCreatorProfileFields() {
  const isCreator = normalizeRole(appState.user?.role || appState.role) === ROLE.CONTENT_CREATOR;
  const roleFields = document.getElementById('creator-profile-fields');
  const collegeGroup = document.getElementById('profile-college-group');
  const academicStep = document.getElementById('step2');
  if (roleFields) roleFields.style.display = isCreator ? 'block' : 'none';
  if (collegeGroup) collegeGroup.style.display = isCreator ? 'none' : '';
  if (academicStep) academicStep.style.display = isCreator ? 'none' : '';
  const teacherFields = document.getElementById('creator-teacher-fields');
  if (teacherFields) {
    teacherFields.style.display = document.getElementById('p-role-type')?.value === 'teacher' ? 'block' : 'none';
  }
}

export function backToStep1() {
  document.getElementById('profile-step1').style.display = 'block';
  document.getElementById('profile-step2').style.display = 'none';
  const s1 = document.getElementById('step1');
  const s2 = document.getElementById('step2');
  if (s1) s1.className = 'profile-step active';
  if (s2) s2.className = 'profile-step';
  window.history?.replaceState?.({ aimeasyPath: '/personal-details', aimeasyIndex: 1 }, '', cleanHashUrl('/personal-details'));
}

export function previewPhoto(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const c = document.getElementById('photo-circle');
    if (c) c.innerHTML = `<img src="${ev.target.result}" alt="Profile">`;
    if (appState.user) appState.user.photo = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function setAcademicSubmitLoading(isLoading) {
  const button = document.querySelector('#profile-step2 button[onclick*="submitProfile"]');
  if (!button) return;
  if (isLoading) {
    if (!button.dataset.originalText) button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = 'Saving...';
    button.setAttribute('aria-busy', 'true');
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || 'Go to Dashboard';
    button.removeAttribute('aria-busy');
  }
}

async function refreshProfileState() {
  try {
    const refreshed = await window.aimeasyRefreshProfile?.();
    window.dispatchEvent(new CustomEvent('aimeasy:profile-updated'));
    return refreshed;
  } catch (e) {
    console.warn('Profile state refresh failed:', e);
    return null;
  }
}

export async function submitProfile() {
  console.log('Button clicked');
  setAcademicSubmitLoading(true);
  const existing = { ...(appState.user || {}) };
  const dbRole = normalizeRole(existing.role || appState.role) || ROLE.STUDENT;
  try {
    if (dbRole === ROLE.CONTENT_CREATOR) {
      appState.user = {
        ...existing,
        role: dbRole,
        role_type: document.getElementById('p-role-type')?.value || existing.role_type,
        qualification: document.getElementById('p-qualification')?.value?.trim() || existing.qualification,
        experience: document.getElementById('p-experience')?.value?.trim() || existing.experience,
      };
      if (!isCreatorProfileComplete(appState.user)) {
        showToast('Please complete your profile details first.', 'red');
        return;
      }
      appState.session = true;
      showLoading('Saving your profile...');
      const { profile, error } = await upsertProfileFromLegacy(appState.user, {
        id: appState.user.id || appState.user.googleId,
        email: appState.user.email,
      });
      if (error) {
        showToast('Could not save profile: ' + error.message, 'red');
        return;
      }
      if (profile) {
        console.log('Academic data saved');
        appState.user = profileToLegacyUser(profile);
      }
      localStorage.setItem('aiiens_session_user', JSON.stringify(appState.user));
      await refreshProfileState();
      clearLoginPortal();
      window.__aimeasyLastAuthRoute = null;
      console.log('Redirecting to dashboard');
      window.history?.replaceState?.({ aimeasyPath: '/creator', aimeasyIndex: 1 }, '', cleanHashUrl('/creator'));
      applyDashboardRedirect(appState.user);
      return;
    }

    const uni = document.getElementById('p-university')?.value?.trim();
    const reg = document.getElementById('p-regulation')?.value?.trim();
    const branch = document.getElementById('p-branch')?.value?.trim();
    const year = document.getElementById('p-year')?.value?.trim();
    const sem = document.getElementById('p-semester')?.value?.trim();
    if (!uni || !reg || !branch || !year || !sem) {
      showToast('Please fill all academic fields', 'red');
      return;
    }

    appState.user = {
      ...existing,
      university: uni,
      university_name: uni,
      university_id: existing.university_id || appState.user?.university_id || null,
      regulation: reg,
      regulation_code: reg,
      regulation_id: existing.regulation_id || appState.user?.regulation_id || null,
      branch,
      branch_name: branch,
      branch_id: existing.branch_id || appState.user?.branch_id || null,
      year,
      semester: sem,
      role: dbRole,
    };
    appState.session = true;
    setCurrentBranch(branch);
    localStorage.setItem('aiiens_session_user', JSON.stringify(appState.user));
    if (appState.user.googleId) {
      localStorage.setItem('aiiens_user_' + appState.user.googleId, JSON.stringify(appState.user));
    }

    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) {
      showToast('Could not save profile: Supabase is not configured.', 'red');
      return;
    }
    if (!appState.user?.id && !appState.user?.googleId) {
      showToast('Could not save profile: missing authenticated user.', 'red');
      return;
    }
    if (!isProfileAcademicComplete(appState.user)) {
      showToast('Please fill all academic fields', 'red');
      return;
    }

    showLoading('Saving your profile...');
    const { profile, error } = await upsertProfileFromLegacy(appState.user, {
      id: appState.user.id || appState.user.googleId,
      email: appState.user.email,
    });
    if (error) {
      showToast('Could not save profile: ' + error.message, 'red');
      return;
    }
    if (!profile) {
      showToast('Could not save profile. Please try again.', 'red');
      return;
    }

    console.log('Academic data saved');
    appState.user = profileToLegacyUser(profile);
    setCurrentBranch(appState.user.branch || appState.user.branch_name);
    if (!appState.user.onboarding_completed) {
      showToast('Could not complete onboarding. Please try again.', 'red');
      return;
    }
    console.log('onboarding_completed updated');
    localStorage.setItem('aiiens_session_user', JSON.stringify(appState.user));
    if (appState.user.googleId || appState.user.id) {
      localStorage.setItem('aiiens_user_' + (appState.user.googleId || appState.user.id), JSON.stringify(appState.user));
    }

    await refreshProfileState();
    clearLoginPortal();
    window.__aimeasyLastAuthRoute = null;
    console.log('Redirecting to dashboard');
    window.history?.replaceState?.({ aimeasyPath: '/student', aimeasyIndex: 1 }, '', cleanHashUrl('/student'));
    applyDashboardRedirect(appState.user);
  } catch (error) {
    console.warn('submitProfile save failed:', error);
    showToast('Could not save profile: ' + (error?.message || String(error)), 'red');
  } finally {
    hideLoading();
    setAcademicSubmitLoading(false);
  }
}

export async function profileStep2() {
  const existing = { ...(appState.user || {}) };
  const name = document.getElementById('p-name')?.value?.trim();
  const phone = document.getElementById('p-phone')?.value?.trim();
  const role = normalizeRole(existing.role || appState.role) || ROLE.STUDENT;
  if (!name) {
    showToast('Please enter your full name.', 'red');
    return;
  }

  const college = document.getElementById('p-college')?.value?.trim();

  if (role === ROLE.STUDENT && !college) {
    showToast('College name is mandatory.', 'red');
    return;
  }
  if (!phone) {
    showToast('Mobile number is mandatory.', 'red');
    return;
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    showToast('Mobile number must be exactly 10 digits.', 'red');
    return;
  }
  appState.user = {
    ...existing,
    name,
    full_name: name,
    phone,
    phone_number: phone,
    college: college || existing.college,
    role,
    role_type: document.getElementById('p-role-type')?.value || existing.role_type,
    qualification: document.getElementById('p-qualification')?.value?.trim() || existing.qualification,
    experience: document.getElementById('p-experience')?.value?.trim() || existing.experience,
  };
  if (role === ROLE.CONTENT_CREATOR && !isCreatorProfileComplete(appState.user)) {
    showToast('Complete the creator role details before continuing.', 'red');
    return;
  }
  const supabase = window.__AIMEASY_SUPABASE__;
  if (supabase && appState.user) {
    if (!isProfilePersonalComplete(appState.user)) return;
    appState.user.role = normalizeRole(appState.user.role || appState.role) || ROLE.STUDENT;
    const { profile, error } = await upsertProfileFromLegacy(appState.user, {
      id: appState.user.id || appState.user.googleId,
      email: appState.user.email,
    });
    if (error) {
      showToast('Could not save profile: ' + error.message, 'red');
      return;
    }
    if (profile) appState.user = profileToLegacyUser(profile);
    if (appState.user.role === ROLE.CONTENT_CREATOR && isProfileFullyComplete(appState.user)) {
      clearLoginPortal();
      hideLoading();
      applyDashboardRedirect(appState.user);
    }
  }
  if (role !== ROLE.CONTENT_CREATOR) {
    document.getElementById('profile-step1').style.display = 'none';
    document.getElementById('profile-step2').style.display = 'block';
    const s1 = document.getElementById('step1');
    const s2 = document.getElementById('step2');
    if (s1) s1.classList.add('done');
    if (s2) s2.classList.add('active');
    window.history?.replaceState?.({ aimeasyPath: '/academic-details', aimeasyIndex: 1 }, '', cleanHashUrl('/academic-details'));
  }
}
