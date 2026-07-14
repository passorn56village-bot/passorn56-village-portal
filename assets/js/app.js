(() => {
  'use strict';

  const config = window.APP_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const views = {
    login: $('#loginView'),
    register: $('#registrationView'),
    dashboard: $('#dashboardView')
  };

  const buttons = {
    login: $('#lineLoginButton'),
    demo: $('#demoLoginButton'),
    logout: $('#logoutButton'),
    checkHouse: $('#checkHouseButton'),
    submitRegister: $('#submitRegistrationButton'),
    cancelRegister: $('#cancelRegistrationButton')
  };

  const form = $('#registrationForm');
  const toast = $('#toast');

  const KEY = {
    session: 'passorn56_session_token',
    member: 'passorn56_member',
    oauthState: 'line_oauth_state'
  };

  const state = { member: null, houseAvailable: false };

  function showToast(message, duration = 4500) {
    if (!toast) return console.log(message);
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function setLoading(button, loading, text = 'กำลังดำเนินการ...') {
    if (!button) return;
    if (loading) {
      button.dataset.oldText = button.textContent;
      button.textContent = text;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.oldText || button.textContent;
      button.disabled = false;
    }
  }

  function hideViews() {
    Object.values(views).forEach((view) => view?.classList.add('hidden'));
  }

  function cleanUrl() {
    history.replaceState({}, document.title, window.location.pathname);
  }

  function saveSession(token, member) {
    if (token) sessionStorage.setItem(KEY.session, token);
    if (member) sessionStorage.setItem(KEY.member, JSON.stringify(member));
  }

  function clearSession() {
    Object.values(KEY).forEach((key) => sessionStorage.removeItem(key));
  }

  function getSessionToken() {
    return sessionStorage.getItem(KEY.session) || '';
  }

  function normalizeMember(member = {}) {
    return {
      registered: Boolean(member.registered),
      displayName: member.displayName || member.lineDisplayName || 'สมาชิกหมู่บ้าน',
      lineDisplayName: member.lineDisplayName || '',
      linePictureUrl: member.linePictureUrl || '',
      houseNo: member.houseNo || member.houseNumber || '-',
      status: member.status || 'สมาชิก',
      role: member.role || 'Member',
      registration: member.registration || null
    };
  }

  async function callApi(payload) {
    if (!config.apiBaseUrl) throw new Error('ยังไม่ได้ตั้งค่า API URL');

    const response = await fetch(config.apiBaseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      console.error('API raw response:', raw);
      throw new Error('API ส่งข้อมูลกลับมาไม่ถูกต้อง');
    }

    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'ระบบไม่สามารถดำเนินการได้');
    }

    return result;
  }

  function showLogin() {
    state.member = null;
    hideViews();
    views.login?.classList.remove('hidden');
    buttons.logout?.classList.add('hidden');
  }

  function showRegistration(member) {
    const m = normalizeMember(member);
    state.member = m;
    state.houseAvailable = false;
    saveSession('', m);

    hideViews();
    views.register?.classList.remove('hidden');
    buttons.logout?.classList.remove('hidden');

    $('#registerLineName').textContent = m.lineDisplayName || m.displayName;
    $('#fullName').value = m.lineDisplayName || m.displayName;

    const picture = $('#registerLinePicture');
    if (picture && m.linePictureUrl) {
      picture.src = m.linePictureUrl;
      picture.classList.remove('hidden');
    }
  }

  function showDashboard(member) {
    const m = normalizeMember(member);
    state.member = m;
    saveSession('', m);

    $('#memberName').textContent = m.displayName;
    $('#memberMeta').textContent = `บ้านเลขที่ ${m.houseNo} · ${m.status}`;
    const badge = $('#memberRoleBadge');
    if (badge) badge.textContent = m.role.toUpperCase();

    hideViews();
    views.dashboard?.classList.remove('hidden');
    buttons.logout?.classList.remove('hidden');
  }

  function routeMember(member) {
    const m = normalizeMember(member);
    m.registered ? showDashboard(m) : showRegistration(m);
  }

  function beginLineLogin() {
    const channelId = String(config?.line?.channelId || '').trim();
    const callbackUrl = String(config?.line?.callbackUrl || '').trim();

    if (!channelId) return showToast('ยังไม่ได้ตั้งค่า LINE Channel ID');
    if (!callbackUrl) return showToast('ยังไม่ได้ตั้งค่า LINE Callback URL');

    const oauthState = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    sessionStorage.setItem(KEY.oauthState, oauthState);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: channelId,
      redirect_uri: callbackUrl,
      state: oauthState,
      scope: 'profile openid'
    });

    location.href = `https://access.line.me/oauth2/v2.1/authorize?${params}`;
  }

  async function handleLineCallback() {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const returnedState = params.get('state');
    const lineError = params.get('error_description') || params.get('error');

    if (lineError) {
      cleanUrl();
      return showToast(lineError);
    }
    if (!code) return;

    setLoading(buttons.login, true, 'กำลังตรวจสอบข้อมูล...');

    try {
      const savedState = sessionStorage.getItem(KEY.oauthState);
      if (!savedState || savedState !== returnedState) {
        throw new Error('ตรวจสอบ LINE Login ไม่สำเร็จ กรุณาลองใหม่');
      }

      const result = await callApi({
        action: 'lineLogin',
        code,
        redirectUri: config.line.callbackUrl,
        state: returnedState
      });

      if (!result.sessionToken || !result.member) {
        throw new Error('API ส่งข้อมูล Login กลับมาไม่ครบ');
      }

      saveSession(result.sessionToken, result.member);
      sessionStorage.removeItem(KEY.oauthState);
      cleanUrl();
      routeMember(result.member);
      showToast(result.member.registered ? 'เข้าสู่ระบบเรียบร้อยแล้ว' : 'กรุณาลงทะเบียนสมาชิก');
    } catch (error) {
      console.error(error);
      clearSession();
      showLogin();
      cleanUrl();
      showToast(error.message || 'เข้าสู่ระบบไม่สำเร็จ', 7000);
    } finally {
      setLoading(buttons.login, false);
    }
  }

  async function checkHouse() {
    const input = $('#houseNumber');
    const value = String(input?.value || '').trim();
    const message = $('#houseCheckMessage');
    state.houseAvailable = false;

    if (!/^\d{1,3}$/.test(value) || Number(value) < 1 || Number(value) > 364) {
      message.textContent = 'กรุณากรอกบ้านเลขที่ตั้งแต่ 1 ถึง 364';
      message.className = 'field-message error';
      return;
    }

    setLoading(buttons.checkHouse, true, 'กำลังตรวจ...');
    try {
      const result = await callApi({
        action: 'checkHouseNumber',
        sessionToken: getSessionToken(),
        houseNumber: value
      });
      state.houseAvailable = Boolean(result.available);
      message.textContent = result.message || '';
      message.className = `field-message ${result.available ? 'success' : 'error'}`;
    } catch (error) {
      message.textContent = error.message;
      message.className = 'field-message error';
    } finally {
      setLoading(buttons.checkHouse, false);
    }
  }

  function collectRegistrationData() {
    const houseNumber = $('#houseNumber').value.trim();
    const fullName = $('#fullName').value.trim();
    const phone = $('#phone').value.replace(/\D/g, '');
    const representativeStatus = $('#representativeStatus').value;
    const email = $('#email').value.trim();

    if (!state.houseAvailable) throw new Error('กรุณากดตรวจสอบบ้านเลขที่ก่อน');
    if (!fullName) throw new Error('กรุณากรอกชื่อ-นามสกุล');
    if (!/^0\d{8,9}$/.test(phone)) throw new Error('กรุณากรอกเบอร์โทรให้ถูกต้อง');
    if (!representativeStatus) throw new Error('กรุณาเลือกสถานะผู้ลงทะเบียน');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('อีเมลไม่ถูกต้อง');
    if (!$('#pdpaConsent').checked) throw new Error('กรุณายินยอม PDPA');
    if (!$('#certification').checked) throw new Error('กรุณารับรองสถานะตัวแทนบ้าน');

    return {
      houseNumber,
      fullName,
      phone,
      lineId: $('#lineId').value.trim(),
      email,
      representativeStatus,
      pdpaConsent: true,
      certification: true,
      pdpaVersion: 'PDPA-CONSENT-V1.0-2026-07-13',
      publicIp: 'Cloudflare Pages',
      userAgent: navigator.userAgent
    };
  }

  async function submitRegistration(event) {
    event.preventDefault();
    setLoading(buttons.submitRegister, true, 'กำลังบันทึกข้อมูล...');

    try {
      const sessionToken = getSessionToken();
      const formData = collectRegistrationData();
      formData.sessionToken = sessionToken;

      const result = await callApi({
        action: 'registerRepresentative',
        sessionToken,
        formData
      });

      const reg = result.registration;
      if (!reg) throw new Error('ไม่พบข้อมูลสมาชิกหลังลงทะเบียน');

      showDashboard({
        registered: true,
        displayName: reg.fullName,
        lineDisplayName: state.member?.lineDisplayName || '',
        linePictureUrl: state.member?.linePictureUrl || '',
        houseNo: reg.houseNumber,
        status: reg.status || 'Active',
        role: reg.role || 'Member',
        registration: reg
      });

      showToast(result.message || 'ลงทะเบียนเรียบร้อยแล้ว');
    } catch (error) {
      console.error(error);
      showToast(error.message || 'ลงทะเบียนไม่สำเร็จ', 7000);
    } finally {
      setLoading(buttons.submitRegister, false);
    }
  }

  async function restoreSession() {
    const token = getSessionToken();
    if (!token) return showLogin();

    try {
      const result = await callApi({ action: 'getSession', sessionToken: token });
      if (!result.authenticated || !result.member) throw new Error('Session หมดอายุ');
      routeMember(result.member);
    } catch {
      clearSession();
      showLogin();
    }
  }

  async function logout() {
    setLoading(buttons.logout, true, 'กำลังออกจากระบบ...');
    try {
      const token = getSessionToken();
      if (token) await callApi({ action: 'logout', sessionToken: token });
    } catch (error) {
      console.warn(error);
    } finally {
      clearSession();
      form?.reset();
      showLogin();
      cleanUrl();
      setLoading(buttons.logout, false);
      showToast('ออกจากระบบเรียบร้อยแล้ว');
    }
  }

  function bindEvents() {
    buttons.login?.addEventListener('click', beginLineLogin);
    buttons.demo?.addEventListener('click', () => showDashboard({ registered: true, displayName: 'สมาชิกตัวอย่าง', houseNo: '100', status: 'Active' }));
    buttons.logout?.addEventListener('click', logout);
    buttons.cancelRegister?.addEventListener('click', logout);
    buttons.checkHouse?.addEventListener('click', checkHouse);
    form?.addEventListener('submit', submitRegistration);

    $('#houseNumber')?.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
      state.houseAvailable = false;
      $('#houseCheckMessage').textContent = '';
    });

    $('#phone')?.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });

    $$('.menu-card').forEach((button) => button.addEventListener('click', () => showToast(`โมดูล ${button.dataset.module || ''} จะพัฒนาในขั้นตอนถัดไป`)));
  }

  async function init() {
    bindEvents();
    const params = new URLSearchParams(location.search);
    if (params.has('code') || params.has('error')) return handleLineCallback();
    return restoreSession();
  }

  init();
})();
