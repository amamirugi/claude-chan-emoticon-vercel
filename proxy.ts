import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// MCP App iframe은 이 서버와 다른 origin에서 실행되므로, 자산·RSC 요청에 CORS 허용이 필요하다.
//
// Next 16에서 middleware 파일 규약이 proxy로 이름이 바뀌었다. 동작은 동일하며
// `export const config`의 matcher도 그대로 쓴다. proxy는 Node.js 런타임에서 실행된다.
export function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS",
    );
    response.headers.set("Access-Control-Allow-Headers", "*");
    return response;
  }

  return NextResponse.next({
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export const config = {
  matcher: "/:path*",
};
