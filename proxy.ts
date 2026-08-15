import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// MCP App iframe은 이 서버와 다른(때로는 opaque/null) origin에서 실행되므로
// 앱 HTML과 Next 정적/RSC 자산에는 cross-origin GET이 필요하다.
// MCP endpoint는 같은 origin 정책과 별개로 remote hosts가 HTTP로 호출하므로
// POST도 유지한다. PUT/DELETE 같은 사용하지 않는 method는 열지 않는다.
function allowedMethods(pathname: string): string {
  return pathname === "/mcp" ? "GET,POST,OPTIONS" : "GET,OPTIONS";
}

export function proxy(request: NextRequest) {
  const methods = allowedMethods(request.nextUrl.pathname);

  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", methods);
    // MCP and Next RSC use non-simple request headers. Keep the header surface
    // host-compatible while narrowing paths and methods instead.
    response.headers.set("Access-Control-Allow-Headers", "*");
    return response;
  }

  return NextResponse.next({
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": methods,
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export const config = {
  // Only routes consumed cross-origin by the MCP host/view need CORS.
  matcher: ["/", "/mcp", "/_next/:path*"],
};
