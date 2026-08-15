"use client";

import Image from "next/image";
import { useMemo } from "react";
import { EMOTION_ASSETS } from "./emotion-assets";
import { EMOTION_LABELS, type Emotion } from "./emotions";
import { useMcpApp } from "./hooks/use-mcp-app";

function isRenderable(value: unknown): value is Emotion {
  return typeof value === "string" && value in EMOTION_ASSETS;
}

export default function Home() {
  const { connected, payload } = useMcpApp();
  const rawEmotion = payload?.emotion;
  const emotion = isRenderable(rawEmotion) ? rawEmotion : null;
  const description = payload?.description;

  // 변형이 있는 감정은 매 호출마다 다른 그림이 나온다.
  // 감정이 바뀌지 않는 한 재렌더에서는 같은 그림을 유지해야 하므로 memo한다.
  const asset = useMemo(() => {
    if (!emotion) return null;
    const variants = EMOTION_ASSETS[emotion];
    return variants[Math.floor(Math.random() * variants.length)];
  }, [emotion]);

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
