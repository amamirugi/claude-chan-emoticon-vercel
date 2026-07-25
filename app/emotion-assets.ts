import type { StaticImageData } from "next/image";
import type { Emotion } from "./emotions";

import angry from "../assets/angry.webp";
import building from "../assets/building.webp";
import chu from "../assets/chu.webp";
import coding from "../assets/coding.webp";
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
import sad from "../assets/sad.webp";
import scared from "../assets/scared.webp";
import searching from "../assets/searching.webp";
import sleepy from "../assets/sleepy.webp";
import smug from "../assets/smug.webp";
import speechless from "../assets/speechless.webp";
import surprised from "../assets/surprised.webp";
import thinking from "../assets/thinking.webp";
import tired from "../assets/tired.webp";
import wink from "../assets/wink.webp";

/**
 * 감정 키 → 정적 에셋 매핑.
 *
 * 정적 import라 존재하지 않는 파일은 빌드 타임에 걸리고,
 * `Record<Emotion, ...>` 덕분에 빠진 감정도 타입 오류로 드러난다.
 * 런타임 검사가 필요 없는 이유다.
 *
 * 변형 에셋(_2/_3)은 아직 배선하지 않았다. M4에서 다룬다.
 */
export const EMOTION_ASSETS: Record<Emotion, StaticImageData> = {
  neutral,
  happy,
  embarrassed,
  sad,
  angry,
  surprised,
  love,
  smug,
  confused,
  crying,
  excited,
  proud,
  scared,
  sleepy,
  thinking,
  tired,
  dead,
  disappointed,
  disgusted,
  facepalm,
  laughing,
  nervous,
  pout,
  speechless,
  wink,
  chu,
  building,
  coding,
  gift,
  reading,
  searching,
};
