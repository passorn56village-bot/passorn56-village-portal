(() => {
  "use strict";

  const config = window.APP_CONFIG || {};

  const loginView =
    document.querySelector("#loginView");

  const registrationView =
    document.querySelector("#registrationView");

  const dashboardView =
    document.querySelector("#dashboardView");

  const logoutButton =
    document.querySelector("#logoutButton");

  const lineLoginButton =
    document.querySelector("#lineLoginButton");

  const demoLoginButton =
    document.querySelector("#demoLoginButton");

  const registrationForm =
    document.querySelector("#registrationForm");

  const checkHouseButton =
    document.querySelector("#checkHouseButton");

  const submitRegistrationButton =
    document.querySelector("#submitRegistrationButton");

  const cancelRegistrationButton =
    document.querySelector("#cancelRegistrationButton");

  const houseCheckMessage =
    document.querySelector("#houseCheckMessage");

  const toast =
    document.querySelector("#toast");


  const SESSION_TOKEN_KEY =
    "passorn56_session_token";

  const MEMBER_KEY =
    "passorn56_member";

  const OAUTH_STATE_KEY =
    "line_oauth_state";


  const state = {
    member: null,
    houseAvailable: false
  };


  function showToast(
    message,
    duration = 4500
  ) {

    if (!toast) {
      console.log(message);
      return;
    }

    toast.textContent =
      String(message || "");

    toast.classList.add("show");

    window.clearTimeout(
      showToast.timer
    );

    showToast.timer =
      window.setTimeout(() => {

        toast.classList.remove("show");

      }, duration);

  }


  function setButtonLoading(
    button,
    loading,
    loadingText = "กำลังดำเนินการ..."
  ) {

    if (!button) return;

    if (loading) {

      button.dataset.originalText =
        button.textContent;

      button.textContent =
        loadingText;

      button.disabled = true;

      return;

    }

    button.textContent =
      button.dataset.originalText ||
      button.textContent;

    button.disabled = false;

  }


  function hideAllViews() {

    loginView?.classList.add("hidden");

    registrationView?.classList.add(
      "hidden"
    );

    dashboardView?.classList.add(
      "hidden"
    );

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

    const savedMember =
      sessionStorage.getItem(MEMBER_KEY);

    if (!savedMember) {
      return null;
    }

    try {

      return JSON.parse(savedMember);

    } catch (error) {

      console.error(
        "Invalid saved member:",
        error
      );

      sessionStorage.removeItem(
        MEMBER_KEY
      );

      return null;

    }

  }


  function saveSessionToken(
    sessionToken
  ) {

    if (!sessionToken) return;

    sessionStorage.setItem(
      SESSION_TOKEN_KEY,
      sessionToken
    );

  }


  function getSessionToken() {

    return (
      sessionStorage.getItem(
        SESSION_TOKEN_KEY
      ) || ""
    );

  }


  function clearLocalSession() {

    sessionStorage.removeItem(
      SESSION_TOKEN_KEY
    );

    sessionStorage.removeItem(
      MEMBER_KEY
    );

    sessionStorage.removeItem(
      OAUTH_STATE_KEY
    );

  }


  async function callApi(payload) {

    if (!config.apiBaseUrl) {

      throw new Error(
        "ยังไม่ได้ตั้งค่า API URL"
      );

    }

    const response = await fetch(
      config.apiBaseUrl,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify(payload)
      }
    );


    const responseText =
      await response.text();


    console.log(
      "API HTTP status:",
      response.status
    );

    console.log(
      "API raw response:",
      responseText
    );


    let result;

    try {

      result =
        JSON.parse(responseText);

    } catch (error) {

      console.error(
        "API JSON parse error:",
        error
      );

      throw new Error(
        "API ส่งข้อมูลกลับมาไม่ถูกต้อง"
      );

    }


    if (
      !response.ok ||
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "ระบบไม่สามารถดำเนินการได้"
      );

    }

    return result;

  }


  function normalizeMember(member) {

    return {

      displayName:
        member?.displayName ||
        member?.lineDisplayName ||
        "สมาชิกหมู่บ้าน",

      lineDisplayName:
        member?.lineDisplayName || "",

      linePictureUrl:
        member?.linePictureUrl || "",

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

      registration:
        member?.registration ||
        null

    };

  }


  function showLogin() {

    state.member = null;

    hideAllViews();

    loginView?.classList.remove(
      "hidden"
    );

    logoutButton?.classList.add(
      "hidden"
    );

  }


  function showRegistration(member) {

    const normalizedMember =
      normalizeMember(member);

    state.member =
      normalizedMember;

    saveMember(normalizedMember);

    state.houseAvailable = false;

    hideAllViews();

    registrationView?.classList.remove(
      "hidden"
    );

    logoutButton?.classList.remove(
      "hidden"
    );


    const lineName =
      document.querySelector(
        "#registerLineName"
      );

    const linePicture =
      document.querySelector(
        "#registerLinePicture"
      );

    const fullName =
      document.querySelector(
        "#fullName"
      );


    if (lineName) {

      lineName.textContent =
        normalizedMember.lineDisplayName ||
        normalizedMember.displayName ||
        "ผู้ใช้งาน LINE";

    }


    if (
      fullName &&
      !fullName.value
    ) {

      fullName.value =
        normalizedMember.lineDisplayName ||
        normalizedMember.displayName ||
        "";

    }


    if (linePicture) {

      if (
        normalizedMember.linePictureUrl
      ) {

        linePicture.src =
          normalizedMember.linePictureUrl;

        linePicture.classList.remove(
          "hidden"
        );

      } else {

        linePicture.removeAttribute(
          "src"
        );

        linePicture.classList.add(
          "hidden"
        );

      }

    }


    if (houseCheckMessage) {

      houseCheckMessage.textContent =
        "";

      houseCheckMessage.className =
        "field-message";

    }

  }


  function showDashboard(member) {

    const normalizedMember =
      normalizeMember(member);

    state.member =
      normalizedMember;

    saveMember(normalizedMember);


    const memberName =
      document.querySelector(
        "#memberName"
      );

    const memberMeta =
      document.querySelector(
        "#memberMeta"
      );

    const roleBadge =
      document.querySelector(
        "#memberRoleBadge"
      );


    if (memberName) {

      memberName.textContent =
        normalizedMember.displayName;

    }


    if (memberMeta) {

      memberMeta.textContent =
        `บ้านเลขที่ ${normalizedMember.houseNo} · ${normalizedMember.status}`;

    }


    if (roleBadge) {

      roleBadge.textContent =
        String(
          normalizedMember.role ||
          "Member"
        ).toUpperCase();

    }


    hideAllViews();

    dashboardView?.classList.remove(
      "hidden"
    );

    logoutButton?.classList.remove(
      "hidden"
    );

  }


  function routeMember(member) {

    const normalizedMember =
      normalizeMember(member);

    if (normalizedMember.registered) {

      showDashboard(
        normalizedMember
      );

    } else {

      showRegistration(
        normalizedMember
      );

    }

  }


  function beginLineLogin() {

    const channelId =
      String(
        config?.line?.channelId ||
        ""
      ).trim();

    const callbackUrl =
      String(
        config?.line?.callbackUrl ||
        ""
      ).trim();


    if (!channelId) {

      showToast(
        "ยังไม่ได้ตั้งค่า LINE Channel ID"
      );

      return;

    }


    if (!callbackUrl) {

      showToast(
        "ยังไม่ได้ตั้งค่า LINE Callback URL"
      );

      return;

    }


    const stateToken =
      typeof crypto.randomUUID ===
      "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;


    sessionStorage.setItem(
      OAUTH_STATE_KEY,
      stateToken
    );


    const params =
      new URLSearchParams({

        response_type:
          "code",

        client_id:
          channelId,

        redirect_uri:
          callbackUrl,

        state:
          stateToken,

        scope:
          "profile openid"

      });


    window.location.href =
      `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;

  }


  async function handleLineCallback() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const code =
      params.get("code");

    const returnedState =
      params.get("state");

    const lineError =
      params.get("error");

    const lineErrorDescription =
      params.get(
        "error_description"
      );


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
        sessionStorage.getItem(
          OAUTH_STATE_KEY
        );


      if (
        !savedState ||
        !returnedState ||
        returnedState !== savedState
      ) {

        throw new Error(
          "ตรวจสอบความถูกต้องของ LINE Login ไม่สำเร็จ กรุณาลองใหม่"
        );

      }


      const result =
        await callApi({

          action:
            "lineLogin",

          code:
            code,

          redirectUri:
            config.line.callbackUrl,

          state:
            returnedState

        });


      if (
        !result.sessionToken ||
        !result.member
      ) {

        throw new Error(
          "API ไม่ได้ส่งข้อมูล Login กลับมาครบถ้วน"
        );

      }


      saveSessionToken(
        result.sessionToken
      );


      sessionStorage.removeItem(
        OAUTH_STATE_KEY
      );


      cleanCallbackUrl();


      routeMember(
        result.member
      );


      showToast(

        result.member.registered

          ? "เข้าสู่ระบบเรียบร้อยแล้ว"

          : "เข้าสู่ระบบแล้ว กรุณาลงทะเบียนสมาชิก"

      );


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


  async function checkHouseNumber() {

    const houseInput =
      document.querySelector(
        "#houseNumber"
      );

    const houseNumber =
      String(
        houseInput?.value ||
        ""
      ).trim();


    state.houseAvailable =
      false;


    if (
      !/^\d{1,3}$/.test(
        houseNumber
      )
    ) {

      if (houseCheckMessage) {

        houseCheckMessage.textContent =
          "กรุณากรอกเลขบ้านตั้งแต่ 1 ถึง 364";

        houseCheckMessage.className =
          "field-message error";

      }

      return;

    }


    const numericHouse =
      Number(houseNumber);


    if (
      numericHouse < 1 ||
      numericHouse > 364
    ) {

      if (houseCheckMessage) {

        houseCheckMessage.textContent =
          "บ้านเลขที่ต้องอยู่ระหว่าง 1 ถึง 364";

        houseCheckMessage.className =
          "field-message error";

      }

      return;

    }


    setButtonLoading(
      checkHouseButton,
      true,
      "กำลังตรวจ..."
    );


    try {

      const result =
        await callApi({

          action:
            "checkHouseNumber",

          sessionToken:
            getSessionToken(),

          houseNumber:
            houseNumber

        });


      state.houseAvailable =
        Boolean(result.available);


      if (houseCheckMessage) {

        houseCheckMessage.textContent =
          result.message || "";

        houseCheckMessage.className =
          "field-message " +
          (
            result.available
              ? "success"
              : "error"
          );

      }


    } catch (error) {

      if (houseCheckMessage) {

        houseCheckMessage.textContent =
          error.message;

        houseCheckMessage.className =
          "field-message error";

      }

    } finally {

      setButtonLoading(
        checkHouseButton,
        false
      );

    }

  }


  function validateRegistrationForm() {

    const houseNumber =
      String(
        document.querySelector(
          "#houseNumber"
        )?.value || ""
      ).trim();


    const fullName =
      String(
        document.querySelector(
          "#fullName"
        )?.value || ""
      ).trim();


    const phone =
      String(
        document.querySelector(
          "#phone"
        )?.value || ""
      ).replace(/\D/g, "");


    const representativeStatus =
      String(
        document.querySelector(
          "#representativeStatus"
        )?.value || ""
      ).trim();


    const lineId =
      String(
        document.querySelector(
          "#lineId"
        )?.value || ""
      ).trim();


    const email =
      String(
        document.querySelector(
          "#email"
        )?.value || ""
      ).trim();


    const pdpaConsent =
      document.querySelector(
        "#pdpaConsent"
      )?.checked === true;


    const certification =
      document.querySelector(
        "#certification"
      )?.checked === true;


    if (
      !/^\d{1,3}$/.test(
        houseNumber
      )
    ) {

      throw new Error(
        "กรุณากรอกบ้านเลขที่ตั้งแต่ 1 ถึง 364"
      );

    }


    const numericHouse =
      Number(houseNumber);


    if (
      numericHouse < 1 ||
      numericHouse > 364
    ) {

      throw new Error(
        "บ้านเลขที่ต้องอยู่ระหว่าง 1 ถึง 364"
      );

    }


    if (!state.houseAvailable) {

      throw new Error(
        "กรุณากดตรวจสอบบ้านเลขที่ก่อนลงทะเบียน"
      );

    }


    if (!fullName) {

      throw new Error(
        "กรุณากรอกชื่อ-นามสกุล"
      );

    }


    if (
      !/^0\d{8,9}$/.test(
        phone
      )
    ) {

      throw new Error(
        "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง เช่น 0812345678"
      );

    }


    if (!representativeStatus) {

      throw new Error(
        "กรุณาเลือกสถานะผู้ลงทะเบียน"
      );

    }


    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {

      throw new Error(
        "กรุณากรอกอีเมลให้ถูกต้อง"
      );

    }


    if (!pdpaConsent) {

      throw new Error(
        "กรุณายินยอมตามรายละเอียดการเก็บและใช้ข้อมูลส่วนบุคคล"
      );

    }


    if (!certification) {

      throw new Error(
        "กรุณารับรองสถานะเจ้าของบ้านหรือผู้ได้รับมอบหมาย"
      );

    }


    return {

      houseNumber:
        houseNumber,

      fullName:
        fullName,

      phone:
        phone,

      lineId:
        lineId,

      email:
        email,

      representativeStatus:
        representativeStatus,

      pdpaConsent:
        true,

      certification:
        true,

      pdpaVersion:
        "PDPA-CONSENT-V1.0-2026-07-13",

      publicIp:
        "ตรวจสอบผ่าน Cloudflare",

      userAgent:
        navigator.userAgent

    };

  }


  async function submitRegistration(
    event
  ) {

    event.preventDefault();


    setButtonLoading(
      submitRegistrationButton,
      true,
      "กำลังบันทึกข้อมูล..."
    );


    try {

      const formData =
        validateRegistrationForm();

      const sessionToken =
        getSessionToken();


      if (!sessionToken) {

        throw new Error(
          "ไม่พบ Session กรุณาเข้าสู่ระบบใหม่"
        );

      }


      const result =
        await callApi({

          action:
            "registerRepresentative",

          sessionToken:
            sessionToken,

          formData: {

            ...formData,

            sessionToken:
              sessionToken

          }

        });


      if (!result.registration) {

        throw new Error(
          "ระบบบันทึกแล้วแต่ไม่พบข้อมูลสมาชิก"
        );

      }


      const member = {

        registered:
          true,

        displayName:
          result.registration.fullName,

        lineDisplayName:
          state.member?.lineDisplayName ||
          "",

        linePictureUrl:
          state.member?.linePictureUrl ||
          "",

        houseNo:
          result.registration.houseNumber,

        status:
          result.registration.status ||
          "Active",

        role:
          result.registration.role ||
          "Member",

        registration:
          result.registration

      };


      showDashboard(member);


      showToast(
        result.message ||
        "ลงทะเบียนเรียบร้อยแล้ว"
      );


    } catch (error) {

      console.error(
        "Registration error:",
        error
      );


      showToast(
        error.message ||
        "ลงทะเบียนไม่สำเร็จ",
        7000
      );


    } finally {

      setButtonLoading(
        submitRegistrationButton,
        false
      );

    }

  }


  async function restoreSession() {

    const sessionToken =
      getSessionToken();


    if (!sessionToken) {

      showLogin();

      return;

    }


    try {

      const result =
        await callApi({

          action:
            "getSession",

          sessionToken:
            sessionToken

        });


      if (
        !result.authenticated ||
        !result.member
      ) {

        throw new Error(
          result.message ||
          "Session หมดอายุ"
        );

      }


      routeMember(
        result.member
      );


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

    const sessionToken =
      getSessionToken();


    setButtonLoading(
      logoutButton,
      true,
      "กำลังออกจากระบบ..."
    );


    try {

      if (sessionToken) {

        await callApi({

          action:
            "logout",

          sessionToken:
            sessionToken

        });

      }

    } catch (error) {

      console.warn(
        "Logout API error:",
        error
      );

    } finally {

      clearLocalSession();

      registrationForm?.reset();

      state.houseAvailable =
        false;

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

      displayName:
        "สมาชิกตัวอย่าง",

      houseNo:
        "100",

      status:
        "Active",

      role:
        "Member",

      registered:
        true

    });


    showToast(
      "เข้าสู่โหมดทดลองแล้ว"
    );

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


    cancelRegistrationButton?.addEventListener(
      "click",
      logoutFromSystem
    );


    checkHouseButton?.addEventListener(
      "click",
      checkHouseNumber
    );


    registrationForm?.addEventListener(
      "submit",
      submitRegistration
    );


    const houseNumberInput =
      document.querySelector(
        "#houseNumber"
      );


    houseNumberInput?.addEventListener(
      "input",
      (event) => {

        event.target.value =
          event.target.value
            .replace(/\D/g, "")
            .slice(0, 3);


        state.houseAvailable =
          false;


        if (houseCheckMessage) {

          houseCheckMessage.textContent =
            "";

          houseCheckMessage.className =
            "field-message";

        }

      }
    );


    const phoneInput =
      document.querySelector(
        "#phone"
      );


    phoneInput?.addEventListener(
      "input",
      (event) => {

        event.target.value =
          event.target.value
            .replace(/\D/g, "")
            .slice(0, 10);

      }
    );


    document
      .querySelectorAll(
        ".menu-card"
      )
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            const moduleName =
              button.dataset.module ||
              "";

            showToast(
              `โมดูล ${moduleName} จะพัฒนาในขั้นตอนถัดไป`
            );

          }
        );

      });

  }


  async function initializeApp() {

    bindEvents();


    const params =
      new URLSearchParams(
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