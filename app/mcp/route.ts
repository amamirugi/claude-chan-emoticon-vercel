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
const UI_VERSION = "2026-07-25-m2-emotions-31";
const RESOURCE_URI = `ui://claude-chan-emoticon/index.html?v=${UI_VERSION}`;

async function fetchPageHtml(): Promise<string> {
  const response = await fetch(baseURL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load MCP App HTML: ${response.status}`);
  }
  return response.text();
}

const emotionList = ACTIVE_EMOTIONS.map(
  (key) => `${key}(${EMOTION_LABELS[key]})`,
).join(", ");

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
      description: `Claude-chan 이모티콘을 대화 안의 MCP App으로 표시한다. 지원 감정: ${emotionList}`,
      inputSchema: {
        emotion: z.enum(ACTIVE_EMOTIONS).describe("표시할 감정"),
        description: z
          .string()
          .max(80)
          .optional()
          .describe("이미지 아래에 표시할 짧은 설명. 생략하면 감정 라벨이 표시된다"),
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
