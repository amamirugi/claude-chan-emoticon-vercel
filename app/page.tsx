"use client";

import Image from "next/image";
import { EMOTION_ASSETS } from "./emotion-assets";
import { EMOTION_LABELS, type ActiveEmotion } from "./emotions";
import { useMcpApp } from "./hooks/use-mcp-app";

function isRenderable(value: unknown): value is ActiveEmotion {
  return typeof value === "string" && value in EMOTION_ASSETS;
}

export default function Home() {
  const { connected, toolInput, toolResult } = useMcpApp();
  const data = (toolResult ?? toolInput) as Record<string, unknown> | null;
  const emotion = data?.emotion;
  const description = data?.description;

  if (!isRenderable(emotion)) {
    return (
      <main>
        <p className="waiting">
          {connected ? "감정 호출을 기다리는 중..." : "MCP host 연결 대기 중..."}
        </p>
      </main>
    );
  }

  const label =
    typeof description === "string" && description.length > 0
      ? description
      : EMOTION_LABELS[emotion];

  return (
    <main>
      <Image
        className="emotion-image"
        src={EMOTION_ASSETS[emotion]}
        alt={`Claude-chan ${emotion} emoticon`}
        priority
      />
      <p className="label">{label}</p>
    </main>
  );
}
