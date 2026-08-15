import type { Metadata } from "next";
import "./globals.css";
import { baseURL } from "@/baseUrl";
import { IframeBootstrap } from "./mcp-app/iframe-bootstrap";

export const metadata: Metadata = {
  title: "Claude-chan Emoticon",
  description: "Minimal MCP App revival slice for Claude.ai",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <IframeBootstrap baseUrl={baseURL} />
      </head>
      <body>{children}</body>
    </html>
  );
}
