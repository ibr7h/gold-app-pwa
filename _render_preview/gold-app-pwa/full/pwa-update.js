(() => {
  'use strict';
  const BASE = '/gold-app-pwa/full/';
  const CURRENT = 'full-1.9.72-20261014';
  const RELEASE_MATCH = /^full-(\d+\.\d+\.\d+)-(\d{8})$/.exec(CURRENT);
  const DISPLAY_VERSION = RELEASE_MATCH ? 'v' + RELEASE_MATCH[1] : '';
  const CHECK_EVERY_MS = 15 * 60 * 1000;
  const PROMPT_ID = 'dhahabi-user-update';
  let registration = null;
  let checking = false;
  let applying = false;
  let dismissedVersion = '';
  let remoteVersion = '';
  let banner = null;

  const online = () => typeof navigator.onLine !== 'boolean' || navigator.onLine;
  const visible = () => document.visibilityState !== 'hidden';
  const trUpdate = key => globalThis.DhahabiUpdateLocale?.t(key) || key;
  const updateDirection = () => globalThis.DhahabiUpdateLocale?.direction() || 'rtl';
  function refreshPromptLanguage() {
    if (!banner) return;
    const title = banner.children[0], info = banner.children[1], actions = banner.children[2];
    if (!title || !info || !actions) return;
    const newer = /^full-(\\d+\\.\\d+\\.\\d+)-\\d{8}$/.exec(remoteVersion);
    title.textContent = trUpdate('available') + (newer ? ' v' + newer[1] : '');
    info.textContent = trUpdate('info');
    actions.children[0].textContent = trUpdate('updateNow');
    actions.children[1].textContent = trUpdate('later');
    banner.setAttribute('aria-label', trUpdate('updateAria'));
    banner.style.direction = updateDirection();
    banner.style.textAlign = updateDirection() === 'rtl' ? 'right' : 'left';
  }

  function notice(message) {
    const prior = document.getElementById('dhahabi-update-notice');
    if (prior) prior.remove();
    const el = document.createElement('div');
    el.id = 'dhahabi-update-notice';
    el.setAttribute('role', 'status');
    el.textContent = message;
    el.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top, 0px) + 16px);left:50%;transform:translateX(-50%);z-index:2147483600;max-width:calc(100vw - 32px);padding:12px 18px;background:#001F3F;color:#F8F9FA;border:1px solid #C5A021;border-radius:14px;font:600 14px system-ui,sans-serif;box-shadow:0 10px 32px #0003;text-align:center;direction:' + updateDirection();
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  }

  function showPrompt(version) {
    if (!version || version === CURRENT || dismissedVersion === version) return;
    remoteVersion = version;
    if (document.getElementById(PROMPT_ID)) return;
    banner = document.createElement('section');
    banner.id = PROMPT_ID;
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-label', trUpdate('updateAria'));
    banner.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top, 0px) + 12px);left:50%;transform:translateX(-50%);z-index:2147483600;box-sizing:border-box;width:min(390px,calc(100vw - 28px));padding:14px;border-radius:18px;border:1px solid #C5A021;background:#F8F9FA;color:#001F3F;box-shadow:0 12px 36px #0004;direction:' + updateDirection() + ';text-align:' + (updateDirection()==='rtl'?'right':'left') + ';font-family:system-ui,sans-serif';
    const title = document.createElement('strong');
    const newer = /^full-(\d+\.\d+\.\d+)-\d{8}$/.exec(version);
    title.textContent = trUpdate('available') + (newer ? ' v' + newer[1] : '');
    title.style.cssText = 'display:block;font-size:15px;line-height:1.6';
    const info = document.createElement('p');
    info.textContent = trUpdate('info');
    info.style.cssText = 'margin:5px 0 12px;font-size:12px;line-height:1.6';
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap';
    const update = document.createElement('button');
    update.type = 'button';
    update.textContent = trUpdate('updateNow');
    update.style.cssText = 'flex:1;min-height:44px;padding:8px 16px;border:0;border-radius:12px;background:#C5A021;color:#001F3F;font:700 14px system-ui,sans-serif;cursor:pointer';
    update.addEventListener('click', () => { void applyUpdate(update); });
    const later = document.createElement('button');
    later.type = 'button';
    later.textContent = trUpdate('later');
    later.style.cssText = 'min-height:44px;padding:8px 14px;border:1px solid #C5A021;border-radius:12px;background:#fff;color:#001F3F;font:600 13px system-ui,sans-serif;cursor:pointer';
    later.addEventListener('click', () => {
      dismissedVersion = remoteVersion;
      banner?.remove();
      banner = null;
    });
    actions.append(update, later);
    banner.append(title, info, actions);
    document.body.appendChild(banner);
    refreshPromptLanguage();
  }

  function reloadNewVersion() {
    const next = new URL(location.href);
    next.searchParams.set('_pwa', Date.now().toString());
    location.replace(next.toString());
  }

  // iOS standalone Web Apps may not emit controllerchange promptly. This is
  // a readiness hint, not a hard prerequisite for navigating to the new HTML.
  function waitForControllerChange() {
    return new Promise(resolve => {
      let done = false;
      const finish = changed => {
        if (done) return;
        done = true;
        resolve(changed);
      };
      navigator.serviceWorker.addEventListener('controllerchange', () => finish(true), {once:true});
      setTimeout(() => finish(false), 6000);
    });
  }

  function waitForInstalling(reg) {
    const worker = reg && reg.installing;
    if (!worker || worker.state === 'installed' || worker.state === 'activated') return Promise.resolve();
    return new Promise(resolve => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' || worker.state === 'activated' || worker.state === 'redundant') finish();
      });
      setTimeout(finish, 10000);
    });
  }

  // Only records the intended version; never clears saved sign-in or user data.
  const ATTEMPT_KEY = 'dhahabi:user:pwa-update-target';
  function recordAttempt(version) {
    try { sessionStorage.setItem(ATTEMPT_KEY, version); } catch {}
  }
  function verifyAttempt() {
    let target = '';
    try { target = sessionStorage.getItem(ATTEMPT_KEY) || ''; sessionStorage.removeItem(ATTEMPT_KEY); } catch {}
    if (target && target !== CURRENT) {
      notice(trUpdate('previousIncomplete'));
    }
  }

  async function applyUpdate(button) {
    if (applying) return;
    applying = true;
    button.disabled = true;
    button.textContent = trUpdate('installing');
    try {
      if (registration) {
        await registration.update();
        await waitForInstalling(registration);
        if (registration.waiting) {
          const changed = waitForControllerChange();
          registration.waiting.postMessage({type:'SKIP_WAITING'});
          // Safari may delay or suppress controllerchange until navigation.
          // A versioned, network-first navigation is the safe fallback.
          await changed;
        }
      }
      // Application data, sessions, IndexedDB, and localStorage are never cleared.
      recordAttempt(remoteVersion);
      reloadNewVersion();
    } catch {
      applying = false;
      button.disabled = false;
      button.textContent = trUpdate('retry');
      notice(trUpdate('installFailed'));
    }
  }

  async function checkForUpdate(manual = false) {
    if (checking) return;
    if (!online()) {
      if (manual) notice(trUpdate('offline'));
      return;
    }
    checking = true;
    try {
      const response = await fetch(BASE + 'version.json?t=' + Date.now(), {cache:'no-store'});
      if (!response.ok) throw new Error('version_unavailable');
      const data = await response.json();
      if (!data || typeof data.version !== 'string' || !/^full-(?:[a-f0-9]{8,40}|\d+\.\d+\.\d+-\d{8})$/.test(data.version)) throw new Error('version_invalid');
      const requested = data?.semanticReleaseVersion || data?.releaseVersion || data?.version;
      if (typeof requested !== 'string' || !/^full-(?:[a-f0-9]{8,40}|\d+\.\d+\.\d+-\d{8})$/.test(requested)) throw new Error('version_invalid');
      if (requested !== CURRENT) {
        showPrompt(requested);
        if (registration) await registration.update().catch(() => {});
      } else if (manual) notice(trUpdate('current') + (DISPLAY_VERSION ? ' (' + DISPLAY_VERSION + ')' : '') + '.');
    } catch {
      if (manual) notice(trUpdate('verifyFailed'));
    } finally {
      checking = false;
    }
  }

  async function start() {
    verifyAttempt();
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register(BASE + 'sw.js', {
          scope: BASE,
          updateViaCache: 'none'
        });
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              void checkForUpdate();
            }
          });
        });
        await registration.update();
      } catch {
        // A failed SW registration should not prevent a normal online version check.
      }
    }
    await checkForUpdate();
  }

  // Generated Expo bundle can retain the prior source version. Display only the
  // deployed release identity from CURRENT, and leave account/session state alone.
  function syncAccountVersion() {
    if (!DISPLAY_VERSION) return;
    document.querySelectorAll('.gold-web.workspace .app-version-account').forEach(el => {
      if (el.textContent?.trim() !== DISPLAY_VERSION) el.textContent = DISPLAY_VERSION;
    });
  }
  function watchAccountVersion() {
    syncAccountVersion();
    const root = document.getElementById('root');
    if (root) new MutationObserver(syncAccountVersion).observe(root, {childList:true,subtree:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchAccountVersion, {once:true});
  else watchAccountVersion();
  
  addEventListener('load', () => { void start(); });
  addEventListener('focus', () => { if (visible()) void checkForUpdate(); });
  addEventListener('online', () => { if (visible()) void checkForUpdate(); });
  document.addEventListener('visibilitychange', () => { if (visible()) void checkForUpdate(); });
  addEventListener('dhahabi:user-language-changed', refreshPromptLanguage);
  addEventListener('dhahabi:user-check-update', () => { void checkForUpdate(true); });
  setInterval(() => { if (visible()) void checkForUpdate(); }, CHECK_EVERY_MS);
})();
