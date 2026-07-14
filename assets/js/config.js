/**
 * Passorn 56 Village Portal configuration
 * ห้ามใส่ LINE Channel Secret หรือข้อมูลลับไว้ในไฟล์นี้
 */
window.APP_CONFIG = {
  appName: "Passorn 56 Village Portal",

  // ใส่ URL ของ Apps Script Web App หลัง Deploy เป็น API แล้ว
  apiBaseUrl: "",

  line: {
    // ใส่ LINE Login Channel ID
    channelId: "2010691661",

    // ต้องตรงกับ Callback URL ที่ตั้งใน LINE Developers
    callbackUrl: window.location.origin + "https://passorn56-village-portal.pages.dev/"
  },

  demoMode: true
};
