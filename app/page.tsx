"use client";

import Image from "next/image";
import { EMOTION_ASSETS } from "./emotion-assets";
import { EMOTION_LABELS, type Emotion } from "./emotions";
import { useMcpApp } from "./hooks/use-mcp-app";

function isRenderable(value: unknown): value is Emotion {
  return typeof value === "string" && value in EMOTION_ASSETS;
}

export default function Home() {
  const { connected, payload, variantSeed } = useMcpApp();
  const rawEmotion = payload?.emotion;
  const emotion = isRenderable(rawEmotion) ? rawEmotion : null;
  const description = payload?.description;

  const asset = emotion
    ? EMOTION_ASSETS[emotion][variantSeed % EMOTION_ASSETS[emotion].length]
    : null;

  if (!emotion || !asset) {
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
        src={asset}
        alt={`Claude-chan ${emotion} emoticon`}
        priority
      />
      <p className="label">{label}</p>
    </main>
  );
}
