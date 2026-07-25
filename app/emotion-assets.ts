import type { StaticImageData } from "next/image";
import type { ActiveEmotion } from "./emotions";

import happy from "../assets/happy.webp";
import sad from "../assets/sad.webp";
import thinking from "../assets/thinking.webp";

/**
 * 감정 키 → 정적 에셋 매핑.
 *
 * 정적 import라 존재하지 않는 파일은 빌드 타임에 걸리고,
 * `Record<ActiveEmotion, ...>` 덕분에 활성 감정 중 빠진 것도 타입 오류로 드러난다.
 * 런타임 검사가 필요 없는 이유다.
 */
export const EMOTION_ASSETS: Record<ActiveEmotion, StaticImageData> = {
  happy,
  sad,
  thinking,
};
