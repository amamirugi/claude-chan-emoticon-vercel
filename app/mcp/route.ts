import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { ACTIVE_EMOTIONS, EMOTION_LABELS } from "@/app/emotions";

// MCP hosts may cache ui:// resources by URI. Derive the cache key from the
// deployed revision so UI changes cannot accidentally reuse stale HTML.
const RESOURCE_CACHE_KEY =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_URL ??
  process.env.GITHUB_SHA ??
  "local";
const RESOURCE_URI = `ui://claude-chan-emoticon/index.html?v=${encodeURIComponent(RESOURCE_CACHE_KEY)}`;

// 언제 부를지에 대한 정책은 여기에 두지 않는다. 정책의 정본은 Claude 개인화 지침이고,
// 이 문서는 사용법만 담당한다. 둘을 다 적으면 이중 정본이 되어 한쪽만 고칠 때 어긋난다.
// 감정 목록도 나열하지 않는다. z.enum이 JSON 스키마에 이미 전부 넣는다.
const TOOL_DESCRIPTION =
  "Claude-chan 이모티콘을 대화 본문에 이미지로 표시한다.";

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
