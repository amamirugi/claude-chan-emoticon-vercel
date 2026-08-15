"use client";

import type { App } from "@modelcontextprotocol/ext-apps";

export type McpRenderPayload = Record<string, unknown>;

export type McpAppSnapshot = {
  connected: boolean;
  payload: McpRenderPayload | null;
  app: App | null;
};

const STORAGE_KEY = "__mcp_render_payload";
const SERVER_SNAPSHOT: McpAppSnapshot = {
  connected: false,
  payload: null,
  app: null,
};

function isRenderPayload(value: unknown): value is McpRenderPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as McpRenderPayload).emotion === "string"
  );
}

function readStoredPayload(): McpRenderPayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isRenderPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredPayload(payload: McpRenderPayload): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage may be unavailable in some hosts.
  }
}

let snapshot: McpAppSnapshot = {
  connected: false,
  payload: typeof window === "undefined" ? null : readStoredPayload(),
  app: null,
};

const listeners = new Set<() => void>();
let connectPromise: Promise<void> | null = null;

function publish(patch: Partial<McpAppSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  for (const listener of listeners) listener();
}

function acceptPayload(value: unknown): void {
  if (!isRenderPayload(value)) return;
  writeStoredPayload(value);
  publish({ payload: value });
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
      acceptPayload(params.arguments);
    };

    app.ontoolresult = (result) => {
      // Some hosts send an empty/incomplete structuredContent after a valid
      // tool-input event. Ignore non-renderable results instead of erasing the
      // last payload that can still be displayed.
      acceptPayload(result.structuredContent);
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
