export async function onRequest(context) {
  if (context.request.method === "GET") {
    return Response.json({
      success: true,
      service: "Passorn56 LINE Login Proxy",
      hasAppsScriptUrl: Boolean(context.env.APPS_SCRIPT_API_URL)
    });
  }

  if (context.request.method !== "POST") {
    return Response.json(
      {
        success: false,
        message: "Method not allowed"
      },
      { status: 405 }
    );
  }

  try {
    const appsScriptUrl = context.env.APPS_SCRIPT_API_URL;

    if (!appsScriptUrl) {
      return Response.json(
        {
          success: false,
          stage: "cloudflare-config",
          message: "ไม่พบตัวแปร APPS_SCRIPT_API_URL ใน Cloudflare"
        },
        { status: 500 }
      );
    }

    const requestBody = await context.request.json();

    const appsScriptResponse = await fetch(appsScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body: JSON.stringify(requestBody),
      redirect: "follow"
    });

    const responseText = await appsScriptResponse.text();

    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error("Apps Script raw response:", responseText);

      return Response.json(
        {
          success: false,
          stage: "apps-script-response",
          message: "Apps Script ไม่ได้ส่ง JSON กลับมา",
          httpStatus: appsScriptResponse.status,
          responsePreview: responseText.slice(0, 300)
        },
        { status: 502 }
      );
    }

    return Response.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("Proxy error:", error);

    return Response.json(
      {
        success: false,
        stage: "cloudflare-proxy",
        message: error?.message || "Cloudflare Proxy ทำงานผิดพลาด"
      },
      { status: 500 }
    );
  }
}