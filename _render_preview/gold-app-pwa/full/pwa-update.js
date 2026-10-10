(() => {
  'use strict';
  const BASE = '/gold-app-pwa/full/';
  const CURRENT = 'full-a19b9802';
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

  function notice(message) {
    const prior = document.getElementById('dhahabi-update-notice');
    if (prior) prior.remove();
    const el = document.createElement('div');
    el.id = 'dhahabi-update-notice';
    el.setAttribute('role', 'status');
    el.textContent = message;
    el.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top, 0px) + 16px);left:50%;transform:translateX(-50%);z-index:2147483600;max-width:calc(100vw - 32px);padding:12px 18px;background:#001F3F;color:#F8F9FA;border:1px solid #C5A021;border-radius:14px;font:600 14px system-ui,sans-serif;box-shadow:0 10px 32px #0003;text-align:center;direction:rtl';
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
    banner.setAttribute('aria-label', 'تحديث تطبيق ذهبي');
    banner.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top, 0px) + 12px);left:50%;transform:translateX(-50%);z-index:2147483600;box-sizing:border-box;width:min(390px,calc(100vw - 28px));padding:14px;border-radius:18px;border:1px solid #C5A021;background:#F8F9FA;color:#001F3F;box-shadow:0 12px 36px #0004;direction:rtl;text-align:right;font-family:system-ui,sans-serif';
    const title = document.createElement('strong');
    title.textContent = 'يتوفر تحديث جديد لذهبي';
    title.style.cssText = 'display:block;font-size:15px;line-height:1.6';
    const info = document.createElement('p');
    info.textContent = 'يمكن تثبيت الإصدار الجديد مع الاحتفاظ بحسابك وبياناتك.';
    info.style.cssText = 'margin:5px 0 12px;font-size:12px;line-height:1.6';
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap';
    const update = document.createElement('button');
    update.type = 'button';
    update.textContent = 'تحديث الآن';
    update.style.cssText = 'flex:1;min-height:44px;padding:8px 16px;border:0;border-radius:12px;background:#C5A021;color:#001F3F;font:700 14px system-ui,sans-serif;cursor:pointer';
    update.addEventListener('click', () => { void applyUpdate(update); });
    const later = document.createElement('button');
    later.type = 'button';
    later.textContent = 'لاحقًا';
    later.style.cssText = 'min-height:44px;padding:8px 14px;border:1px solid #C5A021;border-radius:12px;background:#fff;color:#001F3F;font:600 13px system-ui,sans-serif;cursor:pointer';
    later.addEventListener('click', () => {
      dismissedVersion = remoteVersion;
      banner?.remove();
      banner = null;
    });
    actions.append(update, later);
    banner.append(title, info, actions);
    document.body.appendChild(banner);
  }

  function reloadNewVersion() {
    const next = new URL(location.href);
    next.searchParams.set('_pwa', Date.now().toString());
    location.replace(next.toString());
  }

  function waitForControllerChange() {
    return new Promise(resolve => {
      let done = false;
      const finish = changed => {
        if (done) return;
        done = true;
        resolve(changed);
      };
      navigator.serviceWorker.addEventListener('controllerchange', () => finish(true), {once:true});
      setTimeout(() => finish(false), 12000);
    });
  }

  async function applyUpdate(button) {
    if (applying) return;
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
      // Application data, sessions, IndexedDB, and localStorage are never cleared.
      reloadNewVersion();
    } catch {
      applying = false;
      button.disabled = false;
      button.textContent = 'إعادة المحاولة';
      notice('تعذر تثبيت التحديث الآن. حاول مرة أخرى عند توفر الاتصال.');
    }
  }

  async function checkForUpdate(manual = false) {
    if (checking) return;
    if (!online()) {
      if (manual) notice('لا يوجد اتصال بالإنترنت للتحقق من التحديثات.');
      return;
    }
    checking = true;
    try {
      const response = await fetch(BASE + 'version.json?t=' + Date.now(), {cache:'no-store'});
      if (!response.ok) throw new Error('version_unavailable');
      const data = await response.json();
      if (!data || typeof data.version !== 'string' || !/^full-(?:[a-f0-9]{8,40}|\d+\.\d+\.\d+-\d{8})$/.test(data.version)) throw new Error('version_invalid');
      if (data.version !== CURRENT) {
        showPrompt(data.version);
        if (registration) await registration.update().catch(() => {});
      } else if (manual) notice('تطبيق ذهبي محدّث إلى آخر إصدار.');
    } catch {
      if (manual) notice('تعذر التحقق من التحديثات. حاول مرة أخرى.');
    } finally {
      checking = false;
    }
  }

  async function start() {
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

  addEventListener('load', () => { void start(); });
  addEventListener('focus', () => { if (visible()) void checkForUpdate(); });
  addEventListener('online', () => { if (visible()) void checkForUpdate(); });
  document.addEventListener('visibilitychange', () => { if (visible()) void checkForUpdate(); });
  addEventListener('dhahabi:user-check-update', () => { void checkForUpdate(true); });
  setInterval(() => { if (visible()) void checkForUpdate(); }, CHECK_EVERY_MS);
})();
