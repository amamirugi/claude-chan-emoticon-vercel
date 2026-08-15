"use client";

import { useSyncExternalStore } from "react";
import {
  getMcpAppServerSnapshot,
  getMcpAppSnapshot,
  subscribeMcpApp,
} from "../mcp-app/bridge";

export function useMcpApp() {
  return useSyncExternalStore(
    subscribeMcpApp,
    getMcpAppSnapshot,
    getMcpAppServerSnapshot,
  );
}
