(() => {
  "use strict";

  const config = window.APP_CONFIG || {};

  const loginView = document.querySelector("#loginView");
  const dashboardView = document.querySelector("#dashboardView");
  const logoutButton = document.querySelector("#logoutButton");
  const lineLoginButton = document.querySelector("#lineLoginButton");
  const demoLoginButton = document.querySelector("#demoLoginButton");
  const toast = document.querySelector("#toast");

  const SESSION_TOKEN_KEY = "passorn56_session_token";
  const MEMBER_KEY = "passorn56_member";
  const OAUTH_STATE_KEY = "line_oauth_state";

  const state = {
    member: null
  };

  function showToast(message, duration = 4000) {
    if (!toast) {
      console.log(message);
      return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timer);

    showToast.timer = window.setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  }

  function setButtonLoading(button, loading, loadingText = "กำลังดำเนินการ...") {
    if (!button) return;

    if (loading) {
      button.dataset.originalText = button.textContent;
      button.textContent = loadingText;
      button.disabled = true;
      return;
    }

    button.textContent =
      button.dataset.originalText || button.textContent;

    button.disabled = false;
  }

  function cleanCallbackUrl() {
    history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }

  function saveMember(member) {
    sessionStorage.setItem(
      MEMBER_KEY,
      JSON.stringify(member)
    );
  }

  function getSavedMember() {
    const savedMember = sessionStorage.getItem(MEMBER_KEY);

    if (!savedMember) return null;

    try {
      return JSON.parse(savedMember);
    } catch (error) {
      console.error("Invalid saved member:", error);
      sessionStorage.removeItem(MEMBER_KEY);
      return null;
    }
  }

  function saveSessionToken(sessionToken) {
    if (!sessionToken) return;

    sessionStorage.setItem(
      SESSION_TOKEN_KEY,
      sessionToken
    );
  }

  function getSessionToken() {
    return sessionStorage.getItem(SESSION_TOKEN_KEY) || "";
  }

  function clearLocalSession() {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(MEMBER_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
  }

  function showDashboard(member) {
    const normalizedMember = {
      displayName:
        member?.displayName ||
        member?.lineDisplayName ||
        "สมาชิกหมู่บ้าน",

      houseNo:
        member?.houseNo ||
        member?.houseNumber ||
        "-",

      status:
        member?.status ||
        "สมาชิก",

      role:
        member?.role ||
        "Member",

      registered:
        Boolean(member?.registered),

      linePictureUrl:
        member?.linePictureUrl || "",

      registration:
        member?.registration || null
    };

    state.member = normalizedMember;
    saveMember(normalizedMember);

    const memberName = document.querySelector("#memberName");
    const memberMeta = document.querySelector("#memberMeta");

    if (memberName) {
      memberName.textContent = normalizedMember.displayName;
    }

    if (memberMeta) {
      memberMeta.textContent =
        `บ้านเลขที่ ${normalizedMember.houseNo} · ${normalizedMember.status}`;
    }

    loginView?.classList.add("hidden");
    dashboardView?.classList.remove("hidden");
    logoutButton?.classList.remove("hidden");
  }

  function showLogin() {
    state.member = null;

    dashboardView?.classList.add("hidden");
    loginView?.classList.remove("hidden");
    logoutButton?.classList.add("hidden");
  }

  function beginLineLogin() {
    const channelId = String(
      config?.line?.channelId || ""
    ).trim();

    const callbackUrl = String(
      config?.line?.callbackUrl || ""
    ).trim();

    if (!channelId) {
      showToast(
        "ยังไม่ได้ตั้งค่า LINE Channel ID ใน config.js"
      );
      return;
    }

    if (!callbackUrl) {
      showToast(
        "ยังไม่ได้ตั้งค่า LINE Callback URL ใน config.js"
      );
      return;
    }

    const stateToken =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    sessionStorage.setItem(
      OAUTH_STATE_KEY,
      stateToken
    );

    const params = new URLSearchParams({
      response_type: "code",
      client_id: channelId,
      redirect_uri: callbackUrl,
      state: stateToken,
      scope: "profile openid"
    });

    window.location.href =
      `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  }

  async function handleLineCallback() {
    const params = new URLSearchParams(
      window.location.search
    );

    const code = params.get("code");
    const returnedState = params.get("state");
    const lineError = params.get("error");
    const lineErrorDescription =
      params.get("error_description");

    if (lineError) {
      cleanCallbackUrl();

      showToast(
        lineErrorDescription ||
        "ผู้ใช้ยกเลิกการเข้าสู่ระบบด้วย LINE"
      );

      return;
    }

    if (!code) return;

    setButtonLoading(
      lineLoginButton,
      true,
      "กำลังตรวจสอบข้อมูล..."
    );

    try {
      const savedState =
        sessionStorage.getItem(OAUTH_STATE_KEY);

      if (!savedState) {
        throw new Error(
          "ไม่พบข้อมูลยืนยันการเข้าสู่ระบบ กรุณากดเข้าสู่ระบบใหม่"
        );
      }

      if (!returnedState || returnedState !== savedState) {
        throw new Error(
          "ตรวจสอบความถูกต้องของ LINE Login ไม่สำเร็จ กรุณาลองใหม่"
        );
      }

      if (!config.apiBaseUrl) {
        throw new Error(
          "ยังไม่ได้ตั้งค่า API URL ใน config.js"
        );
      }

      const response = await fetch(
        config.apiBaseUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "lineLogin",
            code: code,
            redirectUri: config.line.callbackUrl,
            state: returnedState
          })
        }
      );

      const responseText = await response.text();

      console.log(
        "Login API HTTP status:",
        response.status
      );

      console.log(
        "Login API raw response:",
        responseText
      );

      let result;

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          "Login API JSON parse error:",
          parseError
        );

        throw new Error(
          "API ส่งข้อมูลกลับมาไม่ถูกต้อง: " +
          responseText.slice(0, 180)
        );
      }

      if (!response.ok || !result.success) {
        console.error(
          "Login API returned error:",
          result
        );

        throw new Error(
          result.message ||
          "LINE Login ไม่สำเร็จ"
        );
      }

      if (!result.sessionToken) {
        throw new Error(
          "API ไม่ได้ส่ง Session Token กลับมา"
        );
      }

      if (!result.member) {
        throw new Error(
          "API ไม่ได้ส่งข้อมูลสมาชิกกลับมา"
        );
      }

      saveSessionToken(result.sessionToken);
      sessionStorage.removeItem(OAUTH_STATE_KEY);

      showDashboard(result.member);
      cleanCallbackUrl();

      if (result.member.registered) {
        showToast("เข้าสู่ระบบเรียบร้อยแล้ว");
      } else {
        showToast(
          "เข้าสู่ระบบแล้ว แต่บัญชีนี้ยังไม่ได้ลงทะเบียน"
        );
      }
    } catch (error) {
      console.error(
        "LINE login error:",
        error
      );

      clearLocalSession();
      showLogin();
      cleanCallbackUrl();

      showToast(
        error?.message ||
        "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่",
        7000
      );
    } finally {
      setButtonLoading(
        lineLoginButton,
        false
      );
    }
  }

  async function restoreSession() {
    const sessionToken = getSessionToken();

    if (!sessionToken || !config.apiBaseUrl) {
      const savedMember = getSavedMember();

      if (savedMember) {
        showDashboard(savedMember);
      }

      return;
    }

    try {
      const response = await fetch(
        config.apiBaseUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "getSession",
            sessionToken: sessionToken
          })
        }
      );

      const responseText = await response.text();

      let result;

      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(
          "ไม่สามารถอ่านข้อมูล Session ได้"
        );
      }

      if (
        !response.ok ||
        !result.success ||
        !result.authenticated
      ) {
        throw new Error(
          result.message ||
          "Session หมดอายุ"
        );
      }

      showDashboard(result.member);
    } catch (error) {
      console.warn(
        "Restore session failed:",
        error
      );

      clearLocalSession();
      showLogin();
    }
  }

  async function logoutFromSystem() {
    const sessionToken = getSessionToken();

    setButtonLoading(
      logoutButton,
      true,
      "กำลังออกจากระบบ..."
    );

    try {
      if (
        sessionToken &&
        config.apiBaseUrl
      ) {
        const response = await fetch(
          config.apiBaseUrl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              action: "logout",
              sessionToken: sessionToken
            })
          }
        );

        const responseText =
          await response.text();

        console.log(
          "Logout API response:",
          responseText
        );
      }
    } catch (error) {
      console.warn(
        "Logout API error:",
        error
      );
    } finally {
      clearLocalSession();
      showLogin();
      cleanCallbackUrl();

      setButtonLoading(
        logoutButton,
        false
      );

      showToast(
        "ออกจากระบบเรียบร้อยแล้ว"
      );
    }
  }

  function loginDemo() {
    showDashboard({
      displayName: "สมาชิกตัวอย่าง",
      houseNo: "56/100",
      status: "สมาชิกผ่านการยืนยัน",
      role: "Member",
      registered: true
    });

    showToast("เข้าสู่โหมดทดลองแล้ว");
  }

  function bindEvents() {
    lineLoginButton?.addEventListener(
      "click",
      beginLineLogin
    );

    demoLoginButton?.addEventListener(
      "click",
      loginDemo
    );

    logoutButton?.addEventListener(
      "click",
      logoutFromSystem
    );

    document
      .querySelectorAll(".menu-card")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const moduleName =
              button.dataset.module || "";

            showToast(
              `โมดูล ${moduleName} จะพัฒนาในขั้นตอนถัดไป`
            );
          }
        );
      });
  }

  async function initializeApp() {
    bindEvents();

    const params = new URLSearchParams(
      window.location.search
    );

    if (
      params.has("code") ||
      params.has("error")
    ) {
      await handleLineCallback();
      return;
    }

    await restoreSession();
  }

  initializeApp();
})();