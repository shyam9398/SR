import appState from '../../core/appState.js';
import eventBus from '../../core/eventBus.js';
import { showToast, showLoading, hideLoading, updateStudyStreak } from '../../utils/helpers.js';
import { supabase } from '../../services/supabase.service.js';
import {
  clearLoginPortal,
  setLoginPortal,
  profileToLegacyUser,
  isProfileFullyComplete,
} from '../../services/auth/profileService.js';
import { normalizeRole, ROLE, applyDashboardRedirect } from '../../services/auth/roleRedirectService.js';
import { getSessionOnce, withAuthTimeout, exchangeOAuthCodeOnce, invalidateSessionCache } from '../../services/auth/authService.js';
import { authLog, AUTH_STAGES } from '../../services/auth/authLogger.js';
import { routeAfterAuth, isOAuthCallbackUrl } from '../../services/auth/postAuthRouter.js';
import { setCurrentBranch } from '../../services/auth/branchContext.js';

export function getStoredLoginPortal() {
  return sessionStorage.getItem('aimeasy_login_portal') || localStorage.getItem('aimeasy_login_portal_backup');
}

export function isLiveWorkshopSession() {
  try {
    return sessionStorage.getItem('aimeasy_login_portal') === 'live_workshop' ||
      localStorage.getItem('aimeasy_login_portal_backup') === 'live_workshop' ||
      sessionStorage.getItem('aiiens_live_workshop_auth') === '1' ||
      (window.location.hash || '').replace(/^#/, '').startsWith('/live-workshops');
  } catch {
    return (window.location.hash || '').replace(/^#/, '').startsWith('/live-workshops');
  }
}

export function isLiveWorkshopLoginRequest() {
  try {
    return getStoredLoginPortal() === 'live_workshop'
      || sessionStorage.getItem('aiiens_live_workshop_auth') === '1'
      || (window.location.hash || '').includes('live-workshops');
  } catch {
    return (window.location.hash || '').includes('live-workshops');
  }
}

export function hasActiveLegacyAdminSession() {
  const route = (window.location.hash || '').replace(/^#/, '');
  return /^\/(admin|subadmin|creator)(\/|$)/.test(route) && Boolean(appState.adminType);
}

export function clearLiveWorkshopPortalMarker() {
  try {
    sessionStorage.removeItem('aiiens_live_workshop_auth');
  } catch { /* ignore */ }
}

export function cleanHashUrl(path) {
  return `${window.location.pathname}#${path}`;
}

export function setLocalLegacySession(user) {
  try {
    const safeUser = user && typeof user === 'object' ? user : null;
    if (safeUser) {
      localStorage.setItem('edusync_session_user', JSON.stringify(safeUser));
      localStorage.setItem('aiiens_session_user', JSON.stringify(safeUser));
      appState.user = safeUser;
      appState.session = true;
    }
  } catch (e) {
    console.error('Failed to set legacy session:', e);
  }
}

export function resolveAppUser() {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem('edusync_session_user') || localStorage.getItem('aiiens_session_user') || 'null');
  } catch (e) { }
  if (stored && typeof stored === 'object') {
    appState.user = { ...stored, ...(appState.user || {}) };
    appState.session = true;
  }
  return appState.user || null;
}

export function hydrateLegacyAuth(session, profile) {
  if (!appState || !session?.user) return null;
  try {
    if (appState.adminType) {
      return null;
    }
  } catch {
    if (appState.adminType) return null;
  }

  const legacyUser = profile ? profileToLegacyUser(profile) : {
    id: session.user.id,
    googleId: session.user.id,
    email: session.user.email,
    name:
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      session.user.email?.split('@')[0] ||
      'Student',
    role: normalizeRole(appState.role) || 'student',
  };

  const role = normalizeRole(legacyUser.role || profile?.role || appState.role) || 'student';
  appState.user = { ...legacyUser, role };
  appState.role = role;
  appState.session = true;
  if (role === 'student') appState.adminType = null;
  localStorage.setItem('aiiens_session_user', JSON.stringify(appState.user));
  localStorage.setItem('edusync_session_user', JSON.stringify(appState.user));
  console.log('[AUTH] Legacy APP hydrated', { userId: session.user.id, role });
  return role;
}

async function completeOAuthCallback(supabaseClient) {
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const rawHash = hash.replace(/^#/, '');
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : rawHash.replace(/^\/auth[/?&]?/, '');
  const hashParams = new URLSearchParams(hashQuery);
  const code = searchParams.get('code') || hashParams.get('code');

  if (code && typeof supabaseClient.auth.exchangeCodeForSession === 'function') {
    const callbackKey = `pkce:${code}`;
    if (!window.__aimeasyOAuthCallbackKey || window.__aimeasyOAuthCallbackKey !== callbackKey) {
      window.__aimeasyOAuthCallbackKey = callbackKey;
      window.__aimeasyOAuthCallbackPromise = exchangeOAuthCodeOnce(code).then(() => {
        authLog(AUTH_STAGES.SUCCESS, { source: 'exchangeCodeForSession' });
        window.history.replaceState(window.history.state, '', `${window.location.pathname}#/auth`);
      });
    }
    return window.__aimeasyOAuthCallbackPromise;
  }

  if (typeof supabaseClient.auth.getSessionFromUrl === 'function') {
    if (rawHash.startsWith('/auth') && /access_token|refresh_token/.test(rawHash)) {
      const tokenFragment = rawHash.replace(/^\/auth[/?&]?/, '');
      window.history.replaceState(window.history.state, '', `${window.location.pathname}#${tokenFragment}`);
    }
    await supabaseClient.auth.getSessionFromUrl();
  }
}

export async function syncSessionFromSupabase({ reason } = {}) {
  if (window.__aimeasyAuthSyncInFlight) return window.__aimeasyAuthSyncInFlight;
  if (!supabase) return false;

  window.__aimeasyAuthSyncInFlight = (async () => {
    window.__aimeasyAuthRestoring = true;
    window.__aimeasyAuthBootstrapComplete = false;
    authLog(AUTH_STAGES.START, {
      reason,
      hash: window.location.hash,
      search: window.location.search,
    });

    let adminSession = null;
    try {
      adminSession = JSON.parse(localStorage.getItem('aiiens_admin_session') || localStorage.getItem('edusync_admin_session') || 'null');
    } catch (e) {
      console.warn('Failed to parse admin session:', e);
    }

    if (adminSession && adminSession.type) {
      appState.role = adminSession.type;
      appState.adminType = adminSession.type === 'content_creator' ? 'content_creator' : adminSession.type;
      appState.session = true;
      if (adminSession.type === 'admin') {
        appState.user = adminSession.data || { username: adminSession.username || 'admin' };
      } else {
        appState.subAdminData = adminSession.data || { username: adminSession.username || 'subadmin' };
        appState.user = adminSession.data || { username: adminSession.username || 'subadmin' };
      }
      console.log('[SESSION RESTORE] Restored legacy admin/subadmin/creator session:', adminSession);
      
      window.__aimeasyAuthBootstrapComplete = true;
      window.__aimeasyAuthRestoring = false;
      window.dispatchEvent(new CustomEvent('aimeasy:auth-bootstrap-complete'));
      
      if (adminSession.type === 'content_creator') {
        window.syncCreatorProfileFields?.();
      }
      
      return true;
    }

    const initialSession = await withAuthTimeout(getSessionOnce(), 'syncSessionFromSupabase.initialSession');
    if (initialSession.error) {
      console.warn('Supabase getSession error:', initialSession.error.message);
      hideLoading();
      return false;
    }

    const hasRestoredSession = Boolean(initialSession.data?.session?.user);
    if (
      hasRestoredSession &&
      hasActiveLegacyAdminSession() &&
      !isOAuthCallbackUrl() &&
      String(reason || '').startsWith('startup')
    ) {
      console.log('[AUTH] Supabase restore skipped; legacy admin session is active', { reason });
      window.__aimeasyAuthBootstrapComplete = true;
      return true;
    }

    if (isOAuthCallbackUrl()) {
      if (hasRestoredSession) {
        console.log('[AUTH] OAuth callback skipped; session already restored', {
          reason,
          userId: initialSession.data.session.user.id,
        });
        window.history.replaceState(window.history.state, '', `${window.location.pathname}#/auth`);
      } else {
        try {
          await withAuthTimeout(completeOAuthCallback(supabase), 'syncSessionFromSupabase.oauthCallback');
          invalidateSessionCache();
        } catch (e) {
          console.warn('OAuth callback completion:', e);
          const { data } = await supabase.auth.getSession();
          window.history.replaceState(window.history.state, '', `${window.location.pathname}#/auth`);
          hideLoading();
          if (!data?.session?.user) {
            showToast('Google sign-in could not be completed. Please try again.', 'red');
          }
          return false;
        }
      }
    }

    const { data, error } = hasRestoredSession
      ? initialSession
      : await withAuthTimeout(getSessionOnce(), 'syncSessionFromSupabase.finalSession');
    if (error) {
      console.warn('Supabase getSession error:', error.message);
      hideLoading();
      return false;
    }
    if (!data?.session?.user) {
      authLog('SESSION MISSING', { reason });
      console.log('[AUTH] Session Missing', { reason });
      hideLoading();
      return false;
    }

    authLog(AUTH_STAGES.SESSION_FOUND, { userId: data.session.user.id, reason });
    console.log('[AUTH] Session Found', { userId: data.session.user.id, reason });
    console.log('[AUTH] Session Restored', { userId: data.session.user.id, reason });

    if (appState.role === 'student' && typeof window.hydrateLegacyState === 'function') {
      console.log('[AUTH] Hydrating legacy state for student', data.session.user.id);
      await window.hydrateLegacyState();
    }

    const portal = getStoredLoginPortal();
    window.__aimeasyRoutingInProgress = true;
    try {
      console.log('[ROUTE] Final Route', {
        target: isProfileFullyComplete(appState.user) ? 'role-dashboard' : 'post-auth-onboarding',
        userId: data.session.user.id,
      });
      const routed = await withAuthTimeout(
        routeAfterAuth(data.session.user, { reason, selectedRole: portal || undefined }),
        'syncSessionFromSupabase.routeAfterAuth',
      );
      window.__aimeasyAuthBootstrapComplete = true;
      return routed;
    } finally {
      window.__aimeasyRoutingInProgress = false;
    }
  })().catch((err) => {
    console.warn('[AUTH] syncSessionFromSupabase failed', err);
    hideLoading();
    return false;
  }).finally(() => {
    if (window.__aimeasyAuthBootstrapComplete === false) {
      window.__aimeasyAuthBootstrapComplete = true;
    }
    if (normalizeRole(appState.role || appState.user?.role) === ROLE.STUDENT) {
      window.setTimeout(() => window.updateSidebarProfile?.(), 0);
    }
    window.dispatchEvent(new CustomEvent('aimeasy:auth-bootstrap-complete'));
    window.__aimeasyAuthSyncInFlight = null;
    window.__aimeasyAuthRestoring = false;
    window.aimeasyRefreshProfile?.();
  });

  return window.__aimeasyAuthSyncInFlight;
}
