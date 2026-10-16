/* Dhahabk Admin updater — separate from User/Trader, no credential persistence. */
(() => {
  'use strict';
  const BASE = '/gold-app-pwa/admin/';
  const CURRENT = 'admin-__ADMIN_BUILD_SHA__';
  const DISPLAY = '__ADMIN_DISPLAY_VERSION__';
  const CHECK_INTERVAL = 15 * 60 * 1000;
  let registration = null;
  let checking = false;
  let applying = false;
  let dismissedVersion = '';
  let remoteVersion = '';
  const byId = id => document.getElementById(id);
  const canCheck = () => typeof navigator.onLine !== 'boolean' || navigator.onLine;
  const visible = () => document.visibilityState !== 'hidden';

  function notify(message) {
    const messageEl = byId('admin-update-notice');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.hidden = false;
    }
  }

  function showOffer(data, manuallyRequested = false) {
    if (!data || data.version === CURRENT || (!manuallyRequested && dismissedVersion === data.version)) return;
    remoteVersion = data.version;
    let banner = byId('admin-update-banner');
    if (banner) {
      byId('admin-update-available-version').textContent = data.displayVersion || 'إصدار جديد';
      return;
    }
    banner = document.createElement('section');
    banner.id = 'admin-update-banner';
    banner.className = 'admin-update-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-label', 'تحديث تطبيق الإدارة');
    const title = document.createElement('strong');
    title.textContent = 'يتوفر تحديث جديد لتطبيق الإدارة';
    const detail = document.createElement('p');
    detail.textContent = 'الإصدار ';
    const next = document.createElement('b');
    next.id = 'admin-update-available-version';
    next.textContent = data.displayVersion || 'جديد';
    detail.appendChild(next);
    const hint = document.createElement('p');
    hint.textContent = 'تحديث الواجهة آمن، لكن قد تحتاج إلى تسجيل الدخول مجددًا بعد التحديث.';
    const actions = document.createElement('div');
    actions.className = 'admin-update-actions';
    const install = document.createElement('button');
    install.type = 'button';
    install.className = 'gold-btn';
    install.textContent = 'تحديث الآن';
    install.addEventListener('click', () => { void applyUpdate(install); });
    const later = document.createElement('button');
    later.type = 'button';
    later.className = 'gold-btn-outline';
    later.textContent = 'لاحقًا';
    later.addEventListener('click', () => {
      dismissedVersion = remoteVersion;
      banner.remove();
    });
    actions.append(install, later);
    banner.append(title, detail, hint, actions);
    document.body.appendChild(banner);
  }

  function reloadNewVersion() {
    const target = new URL(location.href);
    target.searchParams.set('_pwa', Date.now().toString());
    location.replace(target.toString());
  }

  function waitForControllerChange() {
    return new Promise(resolve => {
      let finished = false;
      const finish = ok => {
        if (finished) return;
        finished = true;
        resolve(ok);
      };
      navigator.serviceWorker.addEventListener('controllerchange', () => finish(true), {once:true});
      setTimeout(() => finish(false), 12000);
    });
  }

  async function applyUpdate(button) {
    if (applying || !canCheck()) {
      if (!canCheck()) notify('يجب الاتصال بالإنترنت لتحديث التطبيق.');
      return;
    }
    applying = true;
    button.disabled = true;
    button.textContent = 'جارٍ تثبيت التحديث…';
    try {
      if (registration) {
        await registration.update();
        if (registration.waiting) {
          const changed = waitForControllerChange();
          registration.waiting.postMessage({type:'SKIP_WAITING'});
          if (!await changed) throw new Error('activation_timeout');
        }
      }
      // Never clear localStorage, sessionStorage, IndexedDB, or credentials.
      reloadNewVersion();
    } catch {
      applying = false;
      button.disabled = false;
      button.textContent = 'إعادة المحاولة';
      notify('تعذر تثبيت التحديث. حاول مرة أخرى عندما يكون الاتصال مستقرًا.');
    }
  }

  async function checkForUpdate(manual = false) {
    if (checking) return;
    if (!canCheck()) {
      if (manual) notify('لا يوجد اتصال بالإنترنت للتحقق من التحديثات.');
      return;
    }
    checking = true;
    try {
      const response = await fetch(BASE + 'version.json?t=' + Date.now(), {cache:'no-store'});
      if (!response.ok) throw new Error('version_unavailable');
      const data = await response.json();
      if (!data || typeof data.version !== 'string' || !/^admin-[a-f0-9]{7,40}$/.test(data.version)) {
        throw new Error('invalid_version_metadata');
      }
      if (data.version !== CURRENT) {
        showOffer(data, manual);
        if (registration) await registration.update().catch(() => {});
      } else if (manual) {
        notify('تطبيق الإدارة مُحدّث إلى آخر إصدار (' + DISPLAY + ').');
      }
    } catch {
      if (manual) notify('تعذر التحقق من التحديثات. حاول مرة أخرى.');
    } finally {
      checking = false;
    }
  }

  async function start() {
    // Non-blocking; a failed SW registration must not prevent app login.
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
      } catch { /* Online version checking remains available. */ }
    }
    await checkForUpdate();
  }

  for (const id of ['admin-check-update-login','admin-check-update-settings']) {
    byId(id)?.addEventListener('click', () => { void checkForUpdate(true); });
  }
  addEventListener('load', () => { void start(); });
  addEventListener('focus', () => { if (visible()) void checkForUpdate(); });
  addEventListener('online', () => { if (visible()) void checkForUpdate(); });
  document.addEventListener('visibilitychange', () => { if (visible()) void checkForUpdate(); });
  setInterval(() => { if (visible()) void checkForUpdate(); }, CHECK_INTERVAL);
})();