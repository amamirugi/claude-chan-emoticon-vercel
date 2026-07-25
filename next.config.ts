import type { NextConfig } from "next";
import { baseURL } from "./baseUrl";

const nextConfig: NextConfig = {
  // MCP App iframe은 opaque origin이므로, /_next/* 자산을 실제 서버 절대 URL로 내보낸다.
  assetPrefix: baseURL,
  devIndicators: false,
  // assetPrefix와 이미지 최적화 URL 조합이 꼬이는 것을 피한다. P1은 이미지 1장뿐이라 이득도 없다.
  images: { unoptimized: true },
};

export default nextConfig;
