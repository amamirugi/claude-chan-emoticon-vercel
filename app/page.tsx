"use client";

import Image from "next/image";
import { OUTFIT_ASSETS } from "./emotion-assets";
import {
  DEFAULT_OUTFIT,
  EMOTION_LABELS,
  type Emotion,
  type Outfit,
} from "./emotions";
import { useMcpApp } from "./hooks/use-mcp-app";

function isRenderable(value: unknown): value is Emotion {
  return typeof value === "string" && value in EMOTION_LABELS;
}

function resolveOutfit(value: unknown): Outfit {
  // 의상을 생략했거나 모르는 값이면 기본 의상으로 그린다. 감정 표시를 의상 때문에 막지 않는다.
  return typeof value === "string" && value in OUTFIT_ASSETS
    ? (value as Outfit)
    : DEFAULT_OUTFIT;
}

export default function Home() {
  const { connected, payload, variantSeed } = useMcpApp();
  const rawEmotion = payload?.emotion;
  const emotion = isRenderable(rawEmotion) ? rawEmotion : null;
  const outfit = resolveOutfit(payload?.outfit);
  const description = payload?.description;

  const variants = emotion ? OUTFIT_ASSETS[outfit][emotion] : null;
  const asset = variants ? variants[variantSeed % variants.length] : null;

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
        alt={`Claude-chan ${emotion} emoticon (${outfit})`}
        priority
      />
      <p className="label">{label}</p>
    </main>
  );
}
