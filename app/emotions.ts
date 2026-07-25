/**
 * 감정 키와 한국어 라벨의 정본.
 *
 * 이미지를 import하지 않으므로 서버(route.ts)와 클라이언트(page.tsx) 양쪽에서 안전하게 쓸 수 있다.
 * 실제 에셋 매핑은 `emotion-assets.ts`에 있다.
 *
 * 감정을 추가하려면 여기에 키를 넣고 `emotion-assets.ts`에 에셋을 등록한다.
 * 에셋을 빼먹으면 빌드가 실패한다.
 */

/** assets/에 존재하는 고유 감정 키 31종. */
export const EMOTION_LABELS = {
  neutral: "기본",
  happy: "기쁨",
  embarrassed: "당황",
  sad: "슬픔",
  angry: "화남",
  surprised: "놀람",
  love: "사랑",
  smug: "득의",
  confused: "혼란",
  crying: "울음",
  excited: "신남",
  proud: "자랑",
  scared: "무서움",
  sleepy: "졸림",
  thinking: "생각",
  tired: "피곳",
  dead: "사망",
  disappointed: "실망",
  disgusted: "역겨움",
  facepalm: "한심",
  laughing: "폭소",
  nervous: "초조",
  pout: "샐짐",
  speechless: "말문막힘",
  wink: "윈크",
  chu: "뽀뽀",
  building: "작업 중",
  coding: "코딩",
  gift: "선물",
  reading: "읽는 중",
  searching: "찾는 중",
} as const;

export type Emotion = keyof typeof EMOTION_LABELS;

/**
 * 툴 스키마가 받는 감정 목록. 현재는 정의된 키 전체다.
 * z.enum이 리터럴 튜플을 요구하므로 단언 배열로 단언한다.
 */
export const ACTIVE_EMOTIONS = Object.keys(EMOTION_LABELS) as [
  Emotion,
  ...Emotion[],
];
