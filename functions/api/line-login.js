export async function onRequestPost(context) {
  try {
    const appsScriptUrl = context.env.APPS_SCRIPT_API_URL;

    if (!appsScriptUrl) {
      return Response.json(
        {
          success: false,
          message: "ยังไม่ได้ตั้งค่า APPS_SCRIPT_API_URL ใน Cloudflare"
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
      console.error("Apps Script response is not JSON:", responseText);

      return Response.json(
        {
          success: false,
          message: "Apps Script ไม่ได้ส่งข้อมูล JSON กลับมา"
        },
        { status: 502 }
      );
    }

    return Response.json(responseData, {
      status: appsScriptResponse.ok
        ? 200
        : appsScriptResponse.status,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("Cloudflare proxy error:", error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "ไม่สามารถเชื่อมต่อ Apps Script API ได้"
      },
      { status: 500 }
    );
  }
}