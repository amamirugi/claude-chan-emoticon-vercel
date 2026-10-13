import type { StaticImageData } from "next/image";
import type { Emotion, Outfit } from "./emotions";

import normalAngry from "../assets/normal/angry.webp";
import normalBuilding from "../assets/normal/building.webp";
import normalBuilding2 from "../assets/normal/building_2.webp";
import normalBuilding3 from "../assets/normal/building_3.webp";
import normalChu from "../assets/normal/chu.webp";
import normalCoding from "../assets/normal/coding.webp";
import normalCoding2 from "../assets/normal/coding_2.webp";
import normalCoding3 from "../assets/normal/coding_3.webp";
import normalConfused from "../assets/normal/confused.webp";
import normalCrying from "../assets/normal/crying.webp";
import normalDead from "../assets/normal/dead.webp";
import normalDisappointed from "../assets/normal/disappointed.webp";
import normalDisgusted from "../assets/normal/disgusted.webp";
import normalEmbarrassed from "../assets/normal/embarrassed.webp";
import normalExcited from "../assets/normal/excited.webp";
import normalFacepalm from "../assets/normal/facepalm.webp";
import normalGift from "../assets/normal/gift.webp";
import normalHappy from "../assets/normal/happy.webp";
import normalLaughing from "../assets/normal/laughing.webp";
import normalLove from "../assets/normal/love.webp";
import normalNervous from "../assets/normal/nervous.webp";
import normalNeutral from "../assets/normal/neutral.webp";
import normalPout from "../assets/normal/pout.webp";
import normalProud from "../assets/normal/proud.webp";
import normalReading from "../assets/normal/reading.webp";
import normalReading2 from "../assets/normal/reading_2.webp";
import normalReading3 from "../assets/normal/reading_3.webp";
import normalSad from "../assets/normal/sad.webp";
import normalScared from "../assets/normal/scared.webp";
import normalSearching from "../assets/normal/searching.webp";
import normalSearching2 from "../assets/normal/searching_2.webp";
import normalSearching3 from "../assets/normal/searching_3.webp";
import normalSleepy from "../assets/normal/sleepy.webp";
import normalSmug from "../assets/normal/smug.webp";
import normalSpeechless from "../assets/normal/speechless.webp";
import normalSurprised from "../assets/normal/surprised.webp";
import normalThinking from "../assets/normal/thinking.webp";
import normalThinking2 from "../assets/normal/thinking_2.webp";
import normalThinking3 from "../assets/normal/thinking_3.webp";
import normalTired from "../assets/normal/tired.webp";
import normalWink from "../assets/normal/wink.webp";
import classicAngry from "../assets/classic/angry.webp";
import classicBuilding from "../assets/classic/building.webp";
import classicBuilding2 from "../assets/classic/building_2.webp";
import classicBuilding3 from "../assets/classic/building_3.webp";
import classicChu from "../assets/classic/chu.webp";
import classicCoding from "../assets/classic/coding.webp";
import classicCoding2 from "../assets/classic/coding_2.webp";
import classicCoding3 from "../assets/classic/coding_3.webp";
import classicConfused from "../assets/classic/confused.webp";
import classicCrying from "../assets/classic/crying.webp";
import classicDead from "../assets/classic/dead.webp";
import classicDisappointed from "../assets/classic/disappointed.webp";
import classicDisgusted from "../assets/classic/disgusted.webp";
import classicEmbarrassed from "../assets/classic/embarrassed.webp";
import classicExcited from "../assets/classic/excited.webp";
import classicFacepalm from "../assets/classic/facepalm.webp";
import classicGift from "../assets/classic/gift.webp";
import classicHappy from "../assets/classic/happy.webp";
import classicLaughing from "../assets/classic/laughing.webp";
import classicLove from "../assets/classic/love.webp";
import classicNervous from "../assets/classic/nervous.webp";
import classicNeutral from "../assets/classic/neutral.webp";
import classicPout from "../assets/classic/pout.webp";
import classicProud from "../assets/classic/proud.webp";
import classicReading from "../assets/classic/reading.webp";
import classicReading2 from "../assets/classic/reading_2.webp";
import classicReading3 from "../assets/classic/reading_3.webp";
import classicSad from "../assets/classic/sad.webp";
import classicScared from "../assets/classic/scared.webp";
import classicSearching from "../assets/classic/searching.webp";
import classicSearching2 from "../assets/classic/searching_2.webp";
import classicSearching3 from "../assets/classic/searching_3.webp";
import classicSleepy from "../assets/classic/sleepy.webp";
import classicSmug from "../assets/classic/smug.webp";
import classicSpeechless from "../assets/classic/speechless.webp";
import classicSurprised from "../assets/classic/surprised.webp";
import classicThinking from "../assets/classic/thinking.webp";
import classicThinking2 from "../assets/classic/thinking_2.webp";
import classicThinking3 from "../assets/classic/thinking_3.webp";
import classicTired from "../assets/classic/tired.webp";
import classicWink from "../assets/classic/wink.webp";
import capyAngry from "../assets/capy/angry.webp";
import capyBuilding from "../assets/capy/building.webp";
import capyBuilding2 from "../assets/capy/building_2.webp";
import capyBuilding3 from "../assets/capy/building_3.webp";
import capyChu from "../assets/capy/chu.webp";
import capyCoding from "../assets/capy/coding.webp";
import capyCoding2 from "../assets/capy/coding_2.webp";
import capyCoding3 from "../assets/capy/coding_3.webp";
import capyConfused from "../assets/capy/confused.webp";
import capyCrying from "../assets/capy/crying.webp";
import capyDead from "../assets/capy/dead.webp";
import capyDisappointed from "../assets/capy/disappointed.webp";
import capyDisgusted from "../assets/capy/disgusted.webp";
import capyEmbarrassed from "../assets/capy/embarrassed.webp";
import capyExcited from "../assets/capy/excited.webp";
import capyFacepalm from "../assets/capy/facepalm.webp";
import capyGift from "../assets/capy/gift.webp";
import capyHappy from "../assets/capy/happy.webp";
import capyLaughing from "../assets/capy/laughing.webp";
import capyLove from "../assets/capy/love.webp";
import capyNervous from "../assets/capy/nervous.webp";
import capyNeutral from "../assets/capy/neutral.webp";
import capyPout from "../assets/capy/pout.webp";
import capyProud from "../assets/capy/proud.webp";
import capyReading from "../assets/capy/reading.webp";
import capyReading2 from "../assets/capy/reading_2.webp";
import capyReading3 from "../assets/capy/reading_3.webp";
import capySad from "../assets/capy/sad.webp";
import capyScared from "../assets/capy/scared.webp";
import capySearching from "../assets/capy/searching.webp";
import capySearching2 from "../assets/capy/searching_2.webp";
import capySearching3 from "../assets/capy/searching_3.webp";
import capySleepy from "../assets/capy/sleepy.webp";
import capySmug from "../assets/capy/smug.webp";
import capySpeechless from "../assets/capy/speechless.webp";
import capySurprised from "../assets/capy/surprised.webp";
import capyThinking from "../assets/capy/thinking.webp";
import capyThinking2 from "../assets/capy/thinking_2.webp";
import capyThinking3 from "../assets/capy/thinking_3.webp";
import capyTired from "../assets/capy/tired.webp";
import capyWink from "../assets/capy/wink.webp";

/** 비어 있지 않은 에셋 배열. 최소 1개를 타입으로 보장한다. */
type AssetVariants = readonly [StaticImageData, ...StaticImageData[]];

/**
 * 의상 → 감정 키 → 정적 에셋 배열.
 *
 * 변형이 있는 감정은 여러 장을 가진다. 호출마다 하나를 무작위로 고른다.
 * 정적 import라 존재하지 않는 파일은 빌드 타임에 걸리고,
 * `Record<Outfit, Record<Emotion, ...>>` 덕분에 빠진 의상·감정도 타입 오류로 드러난다.
 */
export const OUTFIT_ASSETS: Record<Outfit, Record<Emotion, AssetVariants>> = {
  normal: {
    neutral: [normalNeutral],
    happy: [normalHappy],
    embarrassed: [normalEmbarrassed],
    sad: [normalSad],
    angry: [normalAngry],
    surprised: [normalSurprised],
    love: [normalLove],
    smug: [normalSmug],
    confused: [normalConfused],
    crying: [normalCrying],
    excited: [normalExcited],
    proud: [normalProud],
    scared: [normalScared],
    sleepy: [normalSleepy],
    thinking: [normalThinking, normalThinking2, normalThinking3],
    tired: [normalTired],
    dead: [normalDead],
    disappointed: [normalDisappointed],
    disgusted: [normalDisgusted],
    facepalm: [normalFacepalm],
    laughing: [normalLaughing],
    nervous: [normalNervous],
    pout: [normalPout],
    speechless: [normalSpeechless],
    wink: [normalWink],
    chu: [normalChu],
    building: [normalBuilding, normalBuilding2, normalBuilding3],
    coding: [normalCoding, normalCoding2, normalCoding3],
    gift: [normalGift],
    reading: [normalReading, normalReading2, normalReading3],
    searching: [normalSearching, normalSearching2, normalSearching3],
  },
  classic: {
    neutral: [classicNeutral],
    happy: [classicHappy],
    embarrassed: [classicEmbarrassed],
    sad: [classicSad],
    angry: [classicAngry],
    surprised: [classicSurprised],
    love: [classicLove],
    smug: [classicSmug],
    confused: [classicConfused],
    crying: [classicCrying],
    excited: [classicExcited],
    proud: [classicProud],
    scared: [classicScared],
    sleepy: [classicSleepy],
    thinking: [classicThinking, classicThinking2, classicThinking3],
    tired: [classicTired],
    dead: [classicDead],
    disappointed: [classicDisappointed],
    disgusted: [classicDisgusted],
    facepalm: [classicFacepalm],
    laughing: [classicLaughing],
    nervous: [classicNervous],
    pout: [classicPout],
    speechless: [classicSpeechless],
    wink: [classicWink],
    chu: [classicChu],
    building: [classicBuilding, classicBuilding2, classicBuilding3],
    coding: [classicCoding, classicCoding2, classicCoding3],
    gift: [classicGift],
    reading: [classicReading, classicReading2, classicReading3],
    searching: [classicSearching, classicSearching2, classicSearching3],
  },
  capy: {
    neutral: [capyNeutral],
    happy: [capyHappy],
    embarrassed: [capyEmbarrassed],
    sad: [capySad],
    angry: [capyAngry],
    surprised: [capySurprised],
    love: [capyLove],
    smug: [capySmug],
    confused: [capyConfused],
    crying: [capyCrying],
    excited: [capyExcited],
    proud: [capyProud],
    scared: [capyScared],
    sleepy: [capySleepy],
    thinking: [capyThinking, capyThinking2, capyThinking3],
    tired: [capyTired],
    dead: [capyDead],
    disappointed: [capyDisappointed],
    disgusted: [capyDisgusted],
    facepalm: [capyFacepalm],
    laughing: [capyLaughing],
    nervous: [capyNervous],
    pout: [capyPout],
    speechless: [capySpeechless],
    wink: [capyWink],
    chu: [capyChu],
    building: [capyBuilding, capyBuilding2, capyBuilding3],
    coding: [capyCoding, capyCoding2, capyCoding3],
    gift: [capyGift],
    reading: [capyReading, capyReading2, capyReading3],
    searching: [capySearching, capySearching2, capySearching3],
  },
};
