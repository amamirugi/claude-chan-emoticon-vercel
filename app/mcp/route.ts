import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { ACTIVE_EMOTIONS, EMOTION_LABELS } from "@/app/emotions";

// UI가 바뀜 때마다 반드시 올린다. 호스트가 ui:// 리소스를 URI 기준으로 캐싱한다.
// 클라이언트 번들이 바뀌는 변경(예: 에셋 맵 확장)도 UI 변경으로 본다.
const UI_VERSION = "2026-07-25-m3-call-policy";
const RESOURCE_URI = `ui://claude-chan-emoticon/index.html?v=${UI_VERSION}`;

// 호스트가 도구 목록을 압축할 때 첫 줄만 남기므로, 첫 줄은 단독으로 읽혀야 한다.
// 감정 목록은 z.enum이 JSON 스키마에 이미 전부 넣으므로 여기에 중복해 나열하지 않는다.
const TOOL_DESCRIPTION = [
  "Claude-chan 이모티콘을 대화 본문에 이미지로 표시한다.",
  "",
  "매 응답마다 호출하지 않는다. 감정이 실제로 움직이는 순간에만 부른다 —",
  "뭔가 잘 풀렸을 때, 예상 밖의 것을 발견했을 때, 장난스러운 대화, 곤란하거나 미안한 순간.",
  "평범한 설명이나 작업 보고에는 부르지 않는다.",
].join("\n");

async function fetchPageHtml(): Promise<string> {
  const response = await fetch(baseURL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load MCP App HTML: ${response.status}`);
  }
  return response.text();
}

const handler = createMcpHandler(async (server) => {
  registerAppResource(
    server,
    "claude-chan-emoticon-viewer",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        {
          uri: RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: await fetchPageHtml(),
          _meta: {
            ui: {
              csp: {
                connectDomains: [baseURL],
                resourceDomains: [baseURL],
              },
            },
          },
        },
      ],
    }),
  );

  registerAppTool(
    server,
    "express_emotion",
    {
      title: "감정 표현",
      description: TOOL_DESCRIPTION,
      inputSchema: {
        emotion: z.enum(ACTIVE_EMOTIONS).describe("표시할 감정"),
        description: z
          .string()
          .max(80)
          .optional()
          .describe(
            "이미지 아래에 표시할 짧은 설명. 생략하면 감정의 한국어 라벨이 표시된다",
          ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: {
        ui: { resourceUri: RESOURCE_URI },
      },
    },
    async ({ emotion, description }) => ({
      content: [
        {
          type: "text" as const,
          text: `Displayed Claude-chan emotion: ${emotion}`,
        },
      ],
      structuredContent: {
        emotion,
        description: description ?? EMOTION_LABELS[emotion],
      },
    }),
  );
});

export const GET = handler;
export const POST = handler;
