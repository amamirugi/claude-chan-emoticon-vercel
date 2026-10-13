"use client";

import type { App } from "@modelcontextprotocol/ext-apps";

export type McpRenderPayload = Record<string, unknown>;

type StoredRenderState = {
  payload: McpRenderPayload;
  variantSeed: number;
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
    return { payload: parsed.payload, variantSeed: parsed.variantSeed };
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

const storedState = typeof window === "undefined" ? null : readStoredState();
let snapshot: McpAppSnapshot = {
  connected: false,
  payload: storedState?.payload ?? null,
  variantSeed: storedState?.variantSeed ?? 0,
  app: null,
};

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
  writeStoredState({ payload, variantSeed });
  publish({ payload, variantSeed });
}

function acceptToolInput(value: unknown): void {
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
      publish({ connected: true, app });
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
