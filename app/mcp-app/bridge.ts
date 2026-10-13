"use client";

import type { App } from "@modelcontextprotocol/ext-apps";

export type McpRenderPayload = Record<string, unknown>;

type StoredRenderState = {
  payload: McpRenderPayload;
  variantSeed: number;
  toolCallId?: string;
};

export type McpAppSnapshot = {
  connected: boolean;
  payload: McpRenderPayload | null;
  variantSeed: number;
  app: App | null;
};

const STORAGE_KEY = "__mcp_render_state";
const SERVER_SNAPSHOT: McpAppSnapshot = {
  connected: false,
  payload: null,
  variantSeed: 0,
  app: null,
};

function isRenderPayload(value: unknown): value is McpRenderPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as McpRenderPayload).emotion === "string"
  );
}

function readStoredState(): StoredRenderState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredRenderState>;
    if (!isRenderPayload(parsed.payload)) return null;
    if (typeof parsed.variantSeed !== "number") return null;
    return {
      payload: parsed.payload,
      variantSeed: parsed.variantSeed,
      toolCallId:
        typeof parsed.toolCallId === "string" ? parsed.toolCallId : undefined,
    };
  } catch {
    return null;
  }
}

function writeStoredState(state: StoredRenderState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be unavailable in some hosts.
  }
}

function createVariantSeed(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0];
}

// sessionStorage는 같은 호스트 페이지의 iframe끼리 공유된다. 저장된 상태를 바로 그리면
// 새 도구 호출의 iframe에 직전 호출의 그림이 잠깐 보이므로, 연결 후 같은 호출임이
// 확인될 때만 복원한다.
const storedState = typeof window === "undefined" ? null : readStoredState();
let snapshot: McpAppSnapshot = {
  connected: false,
  payload: null,
  variantSeed: 0,
  app: null,
};

// 호스트가 알려주는 이 iframe의 tools/call id. 알려주지 않는 호스트에서는 undefined.
let currentToolCallId: string | undefined;
let toolEventSeen = false;
// 호출 id를 모르는 호스트에서, 이벤트를 다시 보내주지 않고 iframe만 다시 띄운 경우를 위한 복원 대기.
const STORED_STATE_FALLBACK_MS = 1000;

const listeners = new Set<() => void>();
let connectPromise: Promise<void> | null = null;

// outfit 없는 tool input은 서버가 저장된 의상을 채운 result가 와야 정확히 그릴 수 있다.
// 바로 그리면 기본 의상이 잠깐 보였다가 바뀌므로 result를 잠시 기다리고,
// result가 비어 오는 호스트에서도 감정은 보이도록 시간이 지나면 input으로 그린다.
const OUTFIT_RESULT_WAIT_MS = 1500;
let pendingInput: { payload: McpRenderPayload; variantSeed: number } | null =
  null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

function clearPendingInput(): void {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = null;
  pendingInput = null;
}

function publish(patch: Partial<McpAppSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  for (const listener of listeners) listener();
}

function render(payload: McpRenderPayload, variantSeed: number): void {
  writeStoredState({ payload, variantSeed, toolCallId: currentToolCallId });
  publish({ payload, variantSeed });
}

function restoreStoredState(): void {
  const stored = storedState;
  if (!stored) return;

  if (currentToolCallId !== undefined) {
    if (stored.toolCallId !== currentToolCallId) return;
    if (snapshot.payload || pendingInput) return;
    publish({ payload: stored.payload, variantSeed: stored.variantSeed });
    return;
  }

  setTimeout(() => {
    if (toolEventSeen || snapshot.payload || pendingInput) return;
    publish({ payload: stored.payload, variantSeed: stored.variantSeed });
  }, STORED_STATE_FALLBACK_MS);
}

function acceptToolInput(value: unknown): void {
  toolEventSeen = true;
  clearPendingInput();
  if (!isRenderPayload(value)) return;
  const variantSeed = createVariantSeed();

  if (typeof value.outfit === "string") {
    render(value, variantSeed);
    return;
  }

  const pending = { payload: value, variantSeed };
  pendingInput = pending;
  pendingTimer = setTimeout(() => {
    if (pendingInput !== pending) return;
    clearPendingInput();
    render(pending.payload, pending.variantSeed);
  }, OUTFIT_RESULT_WAIT_MS);
}

function acceptToolResult(value: unknown): void {
  toolEventSeen = true;
  if (!isRenderPayload(value)) return;

  // A result belongs to the input already being rendered (or held back while
  // waiting for its outfit), so preserve that variant seed. If a host delivers
  // a result without an input event, create a seed here so the result can
  // still render on its own.
  const variantSeed =
    pendingInput?.variantSeed ??
    (snapshot.payload ? snapshot.variantSeed : createVariantSeed());
  clearPendingInput();
  render(value, variantSeed);
}

export function subscribeMcpApp(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMcpAppSnapshot(): McpAppSnapshot {
  return snapshot;
}

export function getMcpAppServerSnapshot(): McpAppSnapshot {
  return SERVER_SNAPSHOT;
}

export function ensureMcpAppConnected(): Promise<void> {
  if (snapshot.app) return Promise.resolve();
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    const { App } = await import("@modelcontextprotocol/ext-apps");
    const app = new App(
      { name: "claude-chan-emoticon-viewer", version: "0.1.0" },
      {},
      { autoResize: true },
    );

    app.ontoolinput = (params) => {
      acceptToolInput(params.arguments);
    };

    app.ontoolresult = (result) => {
      // Some hosts send an empty/incomplete structuredContent after a valid
      // tool-input event. Ignore non-renderable results instead of erasing the
      // last payload that can still be displayed.
      acceptToolResult(result.structuredContent);
    };

    app.onerror = (error) => {
      console.error("[claude-chan] MCP App error", error);
    };

    try {
      await app.connect();
      const toolCallId = app.getHostContext()?.toolInfo?.id;
      currentToolCallId =
        toolCallId === undefined || toolCallId === null
          ? undefined
          : String(toolCallId);
      publish({ connected: true, app });
      if (snapshot.payload) {
        // connect가 끝나기 전에 도착한 이벤트는 호출 id 없이 저장됐으므로 다시 저장한다.
        writeStoredState({
          payload: snapshot.payload,
          variantSeed: snapshot.variantSeed,
          toolCallId: currentToolCallId,
        });
      } else {
        restoreStoredState();
      }
    } catch (error) {
      connectPromise = null;
      console.warn("[claude-chan] MCP App bridge unavailable", error);
    }
  })();

  return connectPromise;
}

if (typeof window !== "undefined" && window.self !== window.top) {
  void ensureMcpAppConnected();
}
