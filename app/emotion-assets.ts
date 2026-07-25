import type { StaticImageData } from "next/image";
import type { Emotion } from "./emotions";

import angry from "../assets/angry.webp";
import building from "../assets/building.webp";
import building2 from "../assets/building_2.webp";
import building3 from "../assets/building_3.webp";
import chu from "../assets/chu.webp";
import coding from "../assets/coding.webp";
import coding2 from "../assets/coding_2.webp";
import coding3 from "../assets/coding_3.webp";
import confused from "../assets/confused.webp";
import crying from "../assets/crying.webp";
import dead from "../assets/dead.webp";
import disappointed from "../assets/disappointed.webp";
import disgusted from "../assets/disgusted.webp";
import embarrassed from "../assets/embarrassed.webp";
import excited from "../assets/excited.webp";
import facepalm from "../assets/facepalm.webp";
import gift from "../assets/gift.webp";
import happy from "../assets/happy.webp";
import laughing from "../assets/laughing.webp";
import love from "../assets/love.webp";
import nervous from "../assets/nervous.webp";
import neutral from "../assets/neutral.webp";
import pout from "../assets/pout.webp";
import proud from "../assets/proud.webp";
import reading from "../assets/reading.webp";
import reading2 from "../assets/reading_2.webp";
import reading3 from "../assets/reading_3.webp";
import sad from "../assets/sad.webp";
import scared from "../assets/scared.webp";
import searching from "../assets/searching.webp";
import searching2 from "../assets/searching_2.webp";
import searching3 from "../assets/searching_3.webp";
import sleepy from "../assets/sleepy.webp";
import smug from "../assets/smug.webp";
import speechless from "../assets/speechless.webp";
import surprised from "../assets/surprised.webp";
import thinking from "../assets/thinking.webp";
import thinking2 from "../assets/thinking_2.webp";
import thinking3 from "../assets/thinking_3.webp";
import tired from "../assets/tired.webp";
import wink from "../assets/wink.webp";

/** 비어 있지 않은 에셋 배열. 최소 1개를 타입으로 보장한다. */
type AssetVariants = readonly [StaticImageData, ...StaticImageData[]];

/**
 * 감정 키 → 정적 에셋 배열.
 *
 * 변형이 있는 감정은 여러 장을 가진다. 호출마다 하나를 무작위로 고른다.
 * 정적 import라 존재하지 않는 파일은 빌드 타임에 걸리고,
 * `Record<Emotion, ...>` 덕분에 빠진 감정도 타입 오류로 드러난다.
 */
export const EMOTION_ASSETS: Record<Emotion, AssetVariants> = {
  neutral: [neutral],
  happy: [happy],
  embarrassed: [embarrassed],
  sad: [sad],
  angry: [angry],
  surprised: [surprised],
  love: [love],
  smug: [smug],
  confused: [confused],
  crying: [crying],
  excited: [excited],
  proud: [proud],
  scared: [scared],
  sleepy: [sleepy],
  thinking: [thinking, thinking2, thinking3],
  tired: [tired],
  dead: [dead],
  disappointed: [disappointed],
  disgusted: [disgusted],
  facepalm: [facepalm],
  laughing: [laughing],
  nervous: [nervous],
  pout: [pout],
  speechless: [speechless],
  wink: [wink],
  chu: [chu],
  building: [building, building2, building3],
  coding: [coding, coding2, coding3],
  gift: [gift],
  reading: [reading, reading2, reading3],
  searching: [searching, searching2, searching3],
};
