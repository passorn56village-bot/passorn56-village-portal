(() => {
  "use strict";

  const config = window.APP_CONFIG || {};
  const loginView = document.querySelector("#loginView");
  const dashboardView = document.querySelector("#dashboardView");
  const logoutButton = document.querySelector("#logoutButton");
  const lineLoginButton = document.querySelector("#lineLoginButton");
  const demoLoginButton = document.querySelector("#demoLoginButton");
  const toast = document.querySelector("#toast");

  const state = {
    member: null
  };

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function showDashboard(member) {
    state.member = member;
    sessionStorage.setItem("passorn56_demo_member", JSON.stringify(member));

    document.querySelector("#memberName").textContent = member.displayName;
    document.querySelector("#memberMeta").textContent =
      `บ้านเลขที่ ${member.houseNo} · ${member.status}`;

    loginView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    logoutButton.classList.remove("hidden");
  }

  function showLogin() {
    state.member = null;
    sessionStorage.removeItem("passorn56_demo_member");
    dashboardView.classList.add("hidden");
    loginView.classList.remove("hidden");
    logoutButton.classList.add("hidden");
  }

  function beginLineLogin() {
    const channelId = config?.line?.channelId;
    const callbackUrl = config?.line?.callbackUrl;

    if (!channelId) {
      showToast("ยังไม่ได้ตั้งค่า LINE Channel ID ใน config.js");
      return;
    }

    const stateToken = crypto.randomUUID();
    sessionStorage.setItem("line_oauth_state", stateToken);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: channelId,
      redirect_uri: callbackUrl,
      state: stateToken,
      scope: "profile openid"
    });

    window.location.href = `https://access.line.me/oauth2/v2.1/authorize?${params}`;
  }

  async function handleLineCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const returnedState = params.get("state");

    if (!code) return;

    const savedState = sessionStorage.getItem("line_oauth_state");
    if (!savedState || returnedState !== savedState) {
      showToast("ตรวจสอบ LINE Login ไม่สำเร็จ กรุณาลองใหม่");
      history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (!config.apiBaseUrl) {
      showToast("ได้รับ LINE authorization code แล้ว แต่ยังไม่ได้ตั้งค่า Apps Script API");
      history.replaceState({}, "", window.location.pathname);
      return;
    }

    // หมายเหตุ: การแลก authorization code เป็น access token
    // ต้องทำที่ Backend เท่านั้น เพื่อไม่เปิดเผย Channel Secret
    try {
      const response = await fetch(config.apiBaseUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "lineLogin",
          code,
          redirectUri: config.line.callbackUrl,
          state: returnedState
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "LINE Login failed");
      }

      showDashboard(result.member);
      history.replaceState({}, "", window.location.pathname);
    } catch (error) {
      console.error(error);
      showToast("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  lineLoginButton.addEventListener("click", beginLineLogin);

  demoLoginButton.addEventListener("click", () => {
    showDashboard({
      displayName: "สมาชิกตัวอย่าง",
      houseNo: "56/100",
      status: "สมาชิกผ่านการยืนยัน"
    });
    showToast("เข้าสู่โหมดทดลองแล้ว");
  });

  logoutButton.addEventListener("click", () => {
    sessionStorage.clear();
    showLogin();
    history.replaceState({}, "", window.location.pathname);
    showToast("ออกจากระบบเรียบร้อยแล้ว");
  });

  document.querySelectorAll(".menu-card").forEach((button) => {
    button.addEventListener("click", () => {
      const moduleName = button.dataset.module;
      showToast(`โมดูล ${moduleName} จะพัฒนาในขั้นตอนถัดไป`);
    });
  });

  const savedMember = sessionStorage.getItem("passorn56_demo_member");
  if (savedMember) {
    try {
      showDashboard(JSON.parse(savedMember));
    } catch {
      showLogin();
    }
  }

  handleLineCallback();
})();
