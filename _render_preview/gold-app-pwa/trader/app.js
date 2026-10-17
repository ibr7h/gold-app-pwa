(() => {
  'use strict';

  const API = 'https://gold-app-api-u8dl.onrender.com';
  const EXPECTED_ROLE = 'merchant';
  const PREFIX = 'dhahabi_trader_';
  const KEY_ACCESS = PREFIX + 'access_token';
  const KEY_REFRESH = PREFIX + 'refresh_token';
  const KEY_EMAIL = PREFIX + 'email';
  const KEY_USER = PREFIX + 'user';

  // Navigation & Views
  const views = {
    login: document.getElementById('login-view'),
    register: document.getElementById('register-view'),
    forgot: document.getElementById('forgot-view'),
    dash: document.getElementById('dash-view')
  };

  function switchView(target) {
    Object.keys(views).forEach((k) => {
      if (views[k]) {
        views[k].classList.toggle('active', k === target);
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Notices
  function showNotice(containerId, msg, type = 'error') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.textContent = msg;
    el.className = 'notice ' + type;
  }

  function clearNotice(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.textContent = '';
    el.className = 'notice';
  }

  // Session Management
  function clearSession() {
    sessionStorage.removeItem(KEY_ACCESS);
    sessionStorage.removeItem(KEY_REFRESH);
    sessionStorage.removeItem(KEY_EMAIL);
    sessionStorage.removeItem(KEY_USER);
  }

  function getAccessToken() {
    return sessionStorage.getItem(KEY_ACCESS);
  }

  function getRefreshToken() {
    return sessionStorage.getItem(KEY_REFRESH);
  }

  function setTokens(access, refresh) {
    if (access) sessionStorage.setItem(KEY_ACCESS, access);
    if (refresh) sessionStorage.setItem(KEY_REFRESH, refresh);
  }

  // API Client with Auth Refresh
  async function json(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = getAccessToken();
    if (token && !headers.Authorization) {
      headers.Authorization = 'Bearer ' + token;
    }

    let res = await fetch(API + endpoint, {
      cache: 'no-store',
      ...options,
      headers
    });

    // Handle token refresh on 401 if we have a refresh token
    if (res.status === 401 && getRefreshToken() && !options._isRetry) {
      try {
        const refreshedToken = await refreshAccessToken();
        headers.Authorization = 'Bearer ' + refreshedToken;
        res = await fetch(API + endpoint, {
          cache: 'no-store',
          ...options,
          headers,
          _isRetry: true
        });
      } catch (refreshErr) {
        clearSession();
        switchView('login');
        throw new Error('انتهت صلاحية الجلسة، يُرجى إعادة تسجيل الدخول.');
      }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      let errMsg = 'تعذر إتمام الطلب بنجاح';
      if (Array.isArray(data?.error?.details)) {
        errMsg = data.error.details.join('، ');
      } else if (data?.error?.message) {
        errMsg = data.error.message;
      } else if (Array.isArray(data?.message)) {
        errMsg = data.message.join('، ');
      } else if (data?.message) {
        errMsg = data.message;
      }
      const err = new Error(errMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function refreshAccessToken() {
    const token = getRefreshToken();
    if (!token) throw new Error('لا يوجد رمز تجديد');
    const res = await json('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token }),
      headers: { Authorization: '' }
    });
    if (!res?.accessToken) throw new Error('فشل تجديد الجلسة');
    setTokens(res.accessToken, res.refreshToken || token);
    return res.accessToken;
  }

  async function getMe() {
    return json('/auth/me');
  }

  async function getProfile() {
    return json('/auth/profile');
  }

  async function updateProfile(fullName, city) {
    return json('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ fullName, city })
    });
  }

  // Enter Dashboard
  let currentTrader = null;
  async function enterDashboard(user) {
    if (!user || (user.role || '').toLowerCase() !== EXPECTED_ROLE) {
      clearSession();
      throw new Error('هذه البوابة مخصصة للتاجر المعتمد (MERCHANT) فقط.');
    }

    currentTrader = user;
    sessionStorage.setItem(KEY_USER, JSON.stringify(user));
    sessionStorage.setItem(KEY_EMAIL, user.email || '');

    const nameDisplay = document.getElementById('merchant-name-display');
    const emailDisplay = document.getElementById('session-email');
    if (nameDisplay) nameDisplay.textContent = user.fullName || user.email || 'التاجر المعتمد';
    if (emailDisplay) emailDisplay.textContent = user.email || '';

    // Populate profile inputs
    const profName = document.getElementById('profile-fullname');
    const profCity = document.getElementById('profile-city');
    const profEmail = document.getElementById('profile-email-readonly');
    if (profName) profName.value = user.fullName || '';
    if (profCity) profCity.value = user.city || '';
    if (profEmail) profEmail.value = user.email || '';

    switchView('dash');
    clearNotice('notice-login');

    // Load initial data
    loadAllPrices();
    loadChart(currentKarat, currentRange);
    checkPushStatus();
  }

  // Prices Management
  const karats = [24, 22, 21, 18];
  let autoRefreshTimer = null;

  async function loadAllPrices() {
    const btn = document.getElementById('btn-refresh-data');
    if (btn) btn.classList.add('loading');

    try {
      const results = await Promise.all(
        karats.map((k) =>
          json(`/prices/latest?karat=${k}&currency=SAR`).catch(() => null)
        )
      );

      results.forEach((item, idx) => {
        const karat = karats[idx];
        const valEl = document.getElementById(`price-${karat}-val`);
        if (!valEl) return;

        const price = Number(item?.buyPrice);
        if (Number.isFinite(price) && price > 0) {
          valEl.innerHTML = `${new Intl.NumberFormat('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(price)} <span class="price-curr">ر.س</span>`;
        } else {
          valEl.textContent = '—';
        }
      });

      const timeEl = document.getElementById('last-update-time');
      if (timeEl) {
        const now = new Date();
        timeEl.textContent = `آخر تحديث: ${now.toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit'
        })}`;
      }
      const statusText = document.getElementById('market-status-text');
      if (statusText) statusText.textContent = 'تحديث الأسعار مباشر (متصل)';
    } catch (e) {
      const statusText = document.getElementById('market-status-text');
      if (statusText) statusText.textContent = 'تعذر تحديث بعض الأسعار';
    } finally {
      if (btn) btn.classList.remove('loading');
    }
  }

  // Interactive SVG Chart
  let currentKarat = '24';
  let currentRange = 'day';

  async function loadChart(karat, range) {
    const container = document.getElementById('chart-svg-container');
    const diffBadge = document.getElementById('chart-diff-badge');
    if (!container) return;

    container.innerHTML = '<div style="display:grid; place-items:center; height:100%; color:var(--muted); font-size:12px;">جارٍ تحميل بيانات الرسم البياني…</div>';

    try {
      const data = await json(`/prices/history/chart?range=${range}&karat=${karat}&currency=SAR`);
      if (!Array.isArray(data) || data.length < 2) {
        container.innerHTML = '<div style="display:grid; place-items:center; height:100%; color:var(--muted); font-size:12px;">لا تتوفر بيانات كافية لهذه الفترة الزمنية</div>';
        if (diffBadge) {
          diffBadge.textContent = '—';
          diffBadge.className = 'chart-stat-diff';
        }
        return;
      }

      // Filter and sort points by timestamp
      const points = data
        .map((p) => ({
          price: Number(p.buyPrice),
          time: new Date(p.timestamp).getTime()
        }))
        .filter((p) => Number.isFinite(p.price) && p.price > 0 && !isNaN(p.time))
        .sort((a, b) => a.time - b.time);

      if (points.length < 2) {
        container.innerHTML = '<div style="display:grid; place-items:center; height:100%; color:var(--muted); font-size:12px;">لا تتوفر بيانات كافية</div>';
        return;
      }

      const firstPrice = points[0].price;
      const lastPrice = points[points.length - 1].price;
      const diff = lastPrice - firstPrice;
      const pct = (diff / firstPrice) * 100;

      if (diffBadge) {
        const sign = diff >= 0 ? '+' : '';
        diffBadge.textContent = `${sign}${pct.toFixed(2)}% (${sign}${diff.toFixed(2)} ر.س)`;
        diffBadge.className = `chart-stat-diff ${diff >= 0 ? 'positive' : 'negative'}`;
      }

      // Render SVG
      const prices = points.map((p) => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const pricePadding = (maxPrice - minPrice) * 0.12 || 1;
      const yMin = minPrice - pricePadding;
      const yMax = maxPrice + pricePadding;

      const width = 560;
      const height = 180;
      const padX = 20;
      const padY = 20;
      const chartW = width - padX * 2;
      const chartH = height - padY * 2;

      const coords = points.map((pt, i) => {
        const x = padX + (i / (points.length - 1)) * chartW;
        const y = padY + chartH - ((pt.price - yMin) / (yMax - yMin)) * chartH;
        return { x: x.toFixed(1), y: y.toFixed(1), price: pt.price };
      });

      const polyPoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
      const areaPoints = `${coords[0].x},${height - 4} ${polyPoints} ${coords[coords.length - 1].x},${height - 4}`;

      const lineColor = diff >= 0 ? '#10B981' : '#EF4444';
      const gradStart = diff >= 0 ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)';

      container.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="${gradStart}"/>
              <stop offset="100%" stop-color="rgba(255, 255, 255, 0)"/>
            </linearGradient>
          </defs>
          <line x1="${padX}" y1="${padY}" x2="${width - padX}" y2="${padY}" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4"/>
          <line x1="${padX}" y1="${padY + chartH / 2}" x2="${width - padX}" y2="${padY + chartH / 2}" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4"/>
          <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="#F1F5F9" stroke-width="1"/>
          
          <polygon points="${areaPoints}" fill="url(#chartGrad)"/>
          <polyline fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${polyPoints}"/>
          
          <circle cx="${coords[coords.length - 1].x}" cy="${coords[coords.length - 1].y}" r="4.5" fill="${lineColor}" stroke="#fff" stroke-width="2"/>
          
          <text x="${width - padX}" y="${padY + 10}" fill="#94A3B8" font-size="10" text-anchor="end">${maxPrice.toFixed(2)} ر.س</text>
          <text x="${width - padX}" y="${height - padY - 4}" fill="#94A3B8" font-size="10" text-anchor="end">${minPrice.toFixed(2)} ر.س</text>
        </svg>
      `;
    } catch (e) {
      container.innerHTML = '<div style="display:grid; place-items:center; height:100%; color:var(--muted); font-size:12px;">تعذر تحميل الرسم البياني حالياً</div>';
    }
  }

  // Tabs Navigation
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const targetId = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach((tc) => {
        tc.style.display = tc.id === targetId ? 'block' : 'none';
      });
    });
  });

  // Chart Controls Event Listeners
  document.querySelectorAll('#chart-karat-select .chart-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#chart-karat-select .chart-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentKarat = btn.getAttribute('data-karat');
      loadChart(currentKarat, currentRange);
    });
  });

  document.querySelectorAll('#chart-range-select .chart-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#chart-range-select .chart-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.getAttribute('data-range');
      loadChart(currentKarat, currentRange);
    });
  });

  // Login Handler
  const loginForm = document.getElementById('login-form');
  const loginSubmit = document.getElementById('login-submit');
  const loginIdentifier = document.getElementById('login-identifier');
  const loginPassword = document.getElementById('login-password');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearNotice('notice-login');

    const idVal = loginIdentifier.value.trim();
    const passVal = loginPassword.value;
    if (!idVal || !passVal) return;

    loginSubmit.disabled = true;
    const prevText = loginSubmit.textContent;
    loginSubmit.innerHTML = '<span class="spinner"></span>جارٍ التحقق…';

    try {
      const body = {
        identifier: idVal,
        email: idVal.includes('@') ? idVal : undefined,
        password: passVal
      };

      const res = await json('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (!res?.accessToken) {
        throw new Error('استجابة تسجيل الدخول غير مكتملة.');
      }

      setTokens(res.accessToken, res.refreshToken);

      const me = await getMe();
      await enterDashboard(me);
    } catch (err) {
      clearSession();
      showNotice('notice-login', err.message || 'تعذر تسجيل الدخول.');
    } finally {
      loginSubmit.disabled = false;
      loginSubmit.textContent = prevText;
    }
  });

  // Merchant Onboarding (Register with invite code)
  const regForm = document.getElementById('register-form');
  const regSubmit = document.getElementById('reg-submit');
  const verifyForm = document.getElementById('verify-onboarding-form');
  const verifySubmit = document.getElementById('verify-submit');
  let currentRegId = null;

  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearNotice('notice-register');

    const code = document.getElementById('reg-code').value.trim();
    const fullName = document.getElementById('reg-fullname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const terms = document.getElementById('reg-terms-check').checked;

    if (!terms) {
      showNotice('notice-register', 'يجب الموافقة على الشروط والأحكام للمتابعة.');
      return;
    }

    regSubmit.disabled = true;
    const prevText = regSubmit.textContent;
    regSubmit.innerHTML = '<span class="spinner"></span>جارٍ فحص الرمز والبيانات…';

    try {
      const payload = {
        code,
        fullName,
        email,
        phone,
        password,
        legalTermsVersion: 'dhahabk-terms-2026-10-v1',
        legalNoticesAcknowledged: true
      };

      const res = await json('/merchant/onboarding/register/start', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      currentRegId = res?.registrationId;
      if (!currentRegId) {
        throw new Error('لم يتم استلام رقم التسجيل من الخادم.');
      }

      regForm.style.display = 'none';
      verifyForm.style.display = 'block';
      document.getElementById('verify-email-display').textContent = email;
      showNotice('notice-register', 'تم قبول رمز الدعوة! أدخل رمز التحقق المرسل لبريدك الإلكتروني.', 'ok');
    } catch (err) {
      showNotice('notice-register', err.message || 'تعذر بدء التسجيل برمز الدعوة.');
    } finally {
      regSubmit.disabled = false;
      regSubmit.textContent = prevText;
    }
  });

  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearNotice('notice-register');

    const code = document.getElementById('verify-code-input').value.trim();
    if (!currentRegId || !code) return;

    verifySubmit.disabled = true;
    const prevText = verifySubmit.textContent;
    verifySubmit.innerHTML = '<span class="spinner"></span>جارٍ تأكيد الحساب…';

    try {
      await json('/merchant/onboarding/register/verify', {
        method: 'POST',
        body: JSON.stringify({ registrationId: currentRegId, code })
      });

      showNotice('notice-register', 'تم تفعيل حساب التاجر بنجاح! يمكنك الآن تسجيل الدخول.', 'ok');
      setTimeout(() => {
        switchView('login');
        loginIdentifier.value = document.getElementById('reg-email').value.trim();
        loginPassword.value = '';
        showNotice('notice-login', 'تم تفعيل حسابك بنجاح. سجّل دخولك الآن.', 'ok');
      }, 1500);
    } catch (err) {
      showNotice('notice-register', err.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية.');
    } finally {
      verifySubmit.disabled = false;
      verifySubmit.textContent = prevText;
    }
  });

  // Password Reset Flow
  const forgotReqForm = document.getElementById('forgot-request-form');
  const forgotReqSubmit = document.getElementById('forgot-request-submit');
  const forgotConfirmForm = document.getElementById('forgot-confirm-form');
  const forgotConfirmSubmit = document.getElementById('forgot-confirm-submit');
  const forgotResendBtn = document.getElementById('forgot-resend-btn');
  const forgotCountdown = document.getElementById('forgot-countdown');
  let resetRequestId = null;
  let resendTimer = null;

  function startResetTimer(seconds) {
    let remain = seconds;
    if (forgotResendBtn) forgotResendBtn.disabled = true;
    if (forgotCountdown) forgotCountdown.textContent = `(انتظر ${remain} ثانية)`;

    clearInterval(resendTimer);
    resendTimer = setInterval(() => {
      remain--;
      if (remain <= 0) {
        clearInterval(resendTimer);
        if (forgotResendBtn) forgotResendBtn.disabled = false;
        if (forgotCountdown) forgotCountdown.textContent = '';
      } else {
        if (forgotCountdown) forgotCountdown.textContent = `(انتظر ${remain} ثانية)`;
      }
    }, 1000);
  }

  forgotReqForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearNotice('notice-forgot');

    const email = document.getElementById('forgot-email').value.trim();
    if (!email) return;

    forgotReqSubmit.disabled = true;
    const prevText = forgotReqSubmit.textContent;
    forgotReqSubmit.innerHTML = '<span class="spinner"></span>جارٍ إرسال الرمز…';

    try {
      const res = await json('/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      resetRequestId = res?.requestId;
      forgotReqForm.style.display = 'none';
      forgotConfirmForm.style.display = 'block';
      showNotice('notice-forgot', 'تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح.', 'ok');
      startResetTimer(res?.resendAfterSeconds || 60);
    } catch (err) {
      showNotice('notice-forgot', err.message || 'تعذر إرسال رمز الاستعادة.');
    } finally {
      forgotReqSubmit.disabled = false;
      forgotReqSubmit.textContent = prevText;
    }
  });

  forgotResendBtn.addEventListener('click', async () => {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) return;
    clearNotice('notice-forgot');

    try {
      const res = await json('/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      resetRequestId = res?.requestId;
      showNotice('notice-forgot', 'تمت إعادة إرسال الرمز بنجاح.', 'ok');
      startResetTimer(res?.resendAfterSeconds || 60);
    } catch (err) {
      showNotice('notice-forgot', err.message || 'تعذر إعادة الإرسال حالياً.');
    }
  });

  forgotConfirmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearNotice('notice-forgot');

    const code = document.getElementById('forgot-code').value.trim();
    const newPassword = document.getElementById('forgot-new-password').value;
    if (!resetRequestId || !code || !newPassword) return;

    forgotConfirmSubmit.disabled = true;
    const prevText = forgotConfirmSubmit.textContent;
    forgotConfirmSubmit.innerHTML = '<span class="spinner"></span>جارٍ حفظ كلمة المرور…';

    try {
      await json('/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ requestId: resetRequestId, code, newPassword })
      });

      showNotice('notice-forgot', 'تم تغيير كلمة المرور بنجاح! يتم الآن الانتقال لتسجيل الدخول…', 'ok');
      setTimeout(() => {
        switchView('login');
        loginIdentifier.value = document.getElementById('forgot-email').value.trim();
        loginPassword.value = '';
        showNotice('notice-login', 'تم تعيين كلمة المرور بنجاح. تفضل بتسجيل الدخول.', 'ok');
      }, 1500);
    } catch (err) {
      showNotice('notice-forgot', err.message || 'رمز التحقق غير صحيح أو منتهي.');
    } finally {
      forgotConfirmSubmit.disabled = false;
      forgotConfirmSubmit.textContent = prevText;
    }
  });

  // Profile Form Handler
  const profileForm = document.getElementById('profile-form');
  const profileSubmit = document.getElementById('profile-submit');

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearNotice('notice-profile');

    const fullName = document.getElementById('profile-fullname').value.trim();
    const city = document.getElementById('profile-city').value.trim();

    profileSubmit.disabled = true;
    const prevText = profileSubmit.textContent;
    profileSubmit.innerHTML = '<span class="spinner"></span>جارٍ الحفظ…';

    try {
      const res = await updateProfile(fullName, city);
      showNotice('notice-profile', 'تم تحديث بيانات التاجر والمنشأة بنجاح.', 'ok');
      if (res?.fullName) {
        document.getElementById('merchant-name-display').textContent = res.fullName;
      }
    } catch (err) {
      showNotice('notice-profile', err.message || 'تعذر حفظ بيانات الملف الشخصي.');
    } finally {
      profileSubmit.disabled = false;
      profileSubmit.textContent = prevText;
    }
  });

  // Web Push Notifications
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const pushToggle = document.getElementById('push-toggle');
  const sessionToggle = document.getElementById('market-session-toggle');
  const testPushBtn = document.getElementById('btn-test-push');

  async function checkPushStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      if (pushToggle) pushToggle.disabled = true;
      if (sessionToggle) sessionToggle.disabled = true;
      if (testPushBtn) testPushBtn.disabled = true;
      showNotice('notice-push', 'هذا المتصفح لا يدعم إشعارات الويب المباشرة.', 'info');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub && Notification.permission === 'granted') {
        if (pushToggle) pushToggle.checked = true;
        if (sessionToggle) sessionToggle.disabled = false;
        if (testPushBtn) testPushBtn.disabled = false;

        // Query server status
        const status = await json('/push/subscriptions/status', {
          method: 'POST',
          body: JSON.stringify({ endpoint: sub.endpoint })
        }).catch(() => null);

        if (sessionToggle && status) {
          sessionToggle.checked = !!status.marketSessionEnabled;
        }
      } else {
        if (pushToggle) pushToggle.checked = false;
        if (sessionToggle) sessionToggle.checked = false;
        if (sessionToggle) sessionToggle.disabled = true;
        if (testPushBtn) testPushBtn.disabled = true;
      }
    } catch {
      // ignore
    }
  }

  if (pushToggle) {
    pushToggle.addEventListener('change', async () => {
      clearNotice('notice-push');
      if (pushToggle.checked) {
        try {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            pushToggle.checked = false;
            showNotice('notice-push', 'تم رفض إذن الإشعارات من المتصفح.');
            return;
          }

          const cfg = await json('/push/config');
          if (!cfg?.configured || !cfg.publicKey) {
            throw new Error('خدمة الإشعارات غير مهيأة في الخادم حالياً.');
          }

          const reg = await navigator.serviceWorker.ready;
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(cfg.publicKey)
            });
          }

          const subData = sub.toJSON();
          await json('/push/subscriptions', {
            method: 'POST',
            body: JSON.stringify({
              endpoint: sub.endpoint,
              keys: subData.keys,
              preferredLanguage: 'ar',
              displayCurrency: 'SAR',
              marketSessionEnabled: sessionToggle ? sessionToggle.checked : false
            })
          });

          showNotice('notice-push', 'تم تفعيل إشعارات الذهب على هذا الجهاز بنجاح!', 'ok');
          if (sessionToggle) sessionToggle.disabled = false;
          if (testPushBtn) testPushBtn.disabled = false;
        } catch (err) {
          pushToggle.checked = false;
          showNotice('notice-push', err.message || 'تعذر تفعيل الإشعارات.');
        }
      } else {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await json('/push/subscriptions', {
              method: 'DELETE',
              body: JSON.stringify({ endpoint: sub.endpoint })
            }).catch(() => null);
            await sub.unsubscribe().catch(() => null);
          }
          if (sessionToggle) sessionToggle.disabled = true;
          if (testPushBtn) testPushBtn.disabled = true;
          showNotice('notice-push', 'تم إيقاف الإشعارات لهذا الجهاز.', 'ok');
        } catch (err) {
          showNotice('notice-push', err.message || 'تعذر إيقاف الإشعارات.');
        }
      }
    });
  }

  if (sessionToggle) {
    sessionToggle.addEventListener('change', async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) return;

        await json('/push/preferences', {
          method: 'POST',
          body: JSON.stringify({
            endpoint: sub.endpoint,
            marketSessionEnabled: sessionToggle.checked,
            preferredLanguage: 'ar',
            displayCurrency: 'SAR'
          })
        });
        showNotice('notice-push', 'تم تحديث تفضيلات تنبيهات السوق بنجاح.', 'ok');
      } catch (err) {
        showNotice('notice-push', err.message || 'تعذر تحديث التفضيلات.');
      }
    });
  }

  if (testPushBtn) {
    testPushBtn.addEventListener('click', async () => {
      clearNotice('notice-push');
      testPushBtn.disabled = true;
      const prev = testPushBtn.textContent;
      testPushBtn.textContent = 'جارٍ إرسال الإشعار…';

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) throw new Error('لا يوجد اشتراك إشعارات نشط لهذا الجهاز.');

        await json('/push/test', {
          method: 'POST',
          body: JSON.stringify({ endpoint: sub.endpoint })
        });
        showNotice('notice-push', 'تم إرسال إشعار تجريبي! تفقّد مركز إشعارات جهازك.', 'ok');
      } catch (err) {
        showNotice('notice-push', err.message || 'تعذر إرسال الإشعار التجريبي.');
      } finally {
        testPushBtn.disabled = false;
        testPushBtn.textContent = prev;
      }
    });
  }

  // Logout Handler (Server logout + local cleanup)
  document.getElementById('logout').addEventListener('click', async () => {
    try {
      // Revoke push before logout so alerts don't arrive on shared device
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready.catch(() => null);
        const sub = await reg?.pushManager?.getSubscription().catch(() => null);
        if (sub) {
          await json('/push/subscriptions', {
            method: 'DELETE',
            body: JSON.stringify({ endpoint: sub.endpoint })
          }).catch(() => null);
          await sub.unsubscribe().catch(() => null);
        }
      }

      await json('/auth/logout', { method: 'POST' }).catch(() => null);
    } finally {
      clearSession();
      clearInterval(autoRefreshTimer);
      switchView('login');
      loginPassword.value = '';
      clearNotice('notice-login');
    }
  });

  // View Navigation Links
  document.getElementById('go-register-link').addEventListener('click', () => {
    switchView('register');
    clearNotice('notice-register');
  });

  document.getElementById('reg-back-login-link').addEventListener('click', () => {
    switchView('login');
    clearNotice('notice-login');
  });

  document.getElementById('go-forgot-link').addEventListener('click', () => {
    switchView('forgot');
    clearNotice('notice-forgot');
  });

  document.getElementById('forgot-back-login-link').addEventListener('click', () => {
    switchView('login');
    clearNotice('notice-login');
  });

  document.getElementById('btn-refresh-data').addEventListener('click', () => {
    loadAllPrices();
    loadChart(currentKarat, currentRange);
  });

  document.getElementById('view-terms-link').addEventListener('click', (e) => {
    e.preventDefault();
    alert('شروط وأحكام منصة ذهبك (dhahabk-terms-2026-10-v1):\n\nتُحدد هذه الشروط ضوابط تقديم خدمات منصة ذهبك لحسابات التجار المعتمدين والمؤشرات الاسترشادية لأسعار الذهب والفضة والمعادن الثمينة. يُقر التاجر بصحة بيانات التسجيل والالتزام بالأنظمة التجارية المعمول بها في المملكة العربية السعودية.');
  });

  // URL Query Parameters check (e.g. ?code=DBK-... or ?invite=DBK-...)
  function checkUrlParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('code') || params.get('invite');
      if (inviteCode && inviteCode.startsWith('DBK-')) {
        const codeInput = document.getElementById('reg-code');
        if (codeInput) codeInput.value = inviteCode;
        switchView('register');
        showNotice('notice-register', 'تم التعرف على رمز الدعوة تلقائياً. يرجى إكمال بيانات الانضمام.', 'ok');
      }
    } catch {
      // ignore
    }
  }

  // Initialization & Auto-login
  (async () => {
    checkUrlParams();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
    }

    try {
      const token = getAccessToken();
      if (token) {
        const user = await getMe();
        if (user) {
          await enterDashboard(user);
        }
      }
    } catch {
      clearSession();
      switchView('login');
    }

    // Auto-refresh prices every 60 seconds
    autoRefreshTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && views.dash.classList.contains('active')) {
        loadAllPrices();
      }
    }, 60000);
  })();
})();