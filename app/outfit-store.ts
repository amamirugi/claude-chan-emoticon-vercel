import { get, put } from "@vercel/blob";
import { OUTFIT_LABELS, type Outfit } from "./emotions";

/**
 * 현재 의상을 Vercel private Blob에 저장한다.
 *
 * 서버는 stateless라 호출 사이에 기억할 곳이 없다. 호스트도 대화 ID를 주지 않으므로
 * 키를 나눌 수 없고, 의상은 이 배포 전체가 공유하는 전역 값 하나다.
 * Blob store를 프로젝트에 연결하면 Vercel이 BLOB_READ_WRITE_TOKEN을 주입한다.
 */
const OUTFIT_PATHNAME = "state/outfit.json";

export function isOutfitStoreConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isOutfit(value: unknown): value is Outfit {
  return typeof value === "string" && value in OUTFIT_LABELS;
}

/** 저장된 의상. 저장소가 없거나, 값이 없거나, 읽기에 실패하면 null. */
export async function readStoredOutfit(): Promise<Outfit | null> {
  if (!isOutfitStoreConfigured()) return null;
  try {
    // 덮어쓴 직후에도 최신 값을 읽도록 CDN 캐시를 건너뛴다.
    const result = await get(OUTFIT_PATHNAME, {
      access: "private",
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const parsed: unknown = JSON.parse(
      await new Response(result.stream).text(),
    );
    const outfit = (parsed as { outfit?: unknown } | null)?.outfit;
    return isOutfit(outfit) ? outfit : null;
  } catch (error) {
    // 의상을 못 읽어도 감정 표시는 기본 의상으로 계속한다.
    console.warn("[claude-chan] failed to read stored outfit", error);
    return null;
  }
}

export async function writeStoredOutfit(outfit: Outfit): Promise<void> {
  if (!isOutfitStoreConfigured()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }
  await put(OUTFIT_PATHNAME, JSON.stringify({ outfit }), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}
