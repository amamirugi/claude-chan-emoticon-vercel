# DECISIONS — Claude-chan Emoticon Vercel

> 이 문서는 이 대화를 보지 못한 다른 AI 인스턴스가 읽는다고 가정하고 작성한다.
> 프로젝트 **상태**의 정본은 Notion `🚀 Projects`이고, 이 문서는 **결정과 근거**의 정본이다.

## 확정된 결정

### 구조

- 이 리포는 기존 Railway 리포(`amamirugi/claude-chan-emoticon-railway`)와 분리된 Vercel 전용 정본이다.
- 기본 브랜치 `main`을 Vercel Production Branch로 사용한다. `main`에 push하면 프로덕션 배포가 자동으로 나간다.
- MCP endpoint는 `/mcp` 단일이며 stateless Streamable HTTP만 사용한다.
- 결과 이미지는 raw MCP `type: image`가 아니라 MCP App iframe 내부에서 렌더링한다.
- 툴 결과는 `structuredContent`로만 전달한다. 모델 컨텍스트에 이미지 데이터를 넣지 않는다.
- 에셋은 이 리포에 자체 포함한다. 외부 호스팅을 참조하지 않는다.

### iframe 부트스트랩 (필수)

MCP 호스트는 UI 리소스 HTML을 opaque origin iframe에서 실행한다. 따라서 공식 `vercel-labs/mcp-apps-nextjs-starter`의 다음 3개가 **모두** 있어야 한다. 하나라도 빠지면 동일한 증상이 재현된다.

- `next.config.ts` — `assetPrefix: baseURL`
- `middleware.ts` — 전 경로 CORS 허용
- `app/layout.tsx` — `IframeBootstrap` (`<base href>`, history 패치, fetch 패치)

### 감정 키 범위

- 최종 감정 키는 **31개**로 한다. Railway 리포 `assets/`의 고유 키 전체다.
- 근거: 원본 `index.js`의 `EMOTIONS` 배열과 `CLAUDE.md` 매핑표는 26개였지만, `assets/`에는 실제로 41개 파일 / 31개 고유 키가 존재한다. `building` `coding` `gift` `reading` `searching` 5키는 에셋이 있음에도 배열에 없어 원본에서 한 번도 사용되지 않았다.
- 변형 에셋(`_2`/`_3`, 15파일: building/coding/reading/searching/thinking)은 31키 안의 선택지로 다룬다. 별도 키로 승격하지 않는다.

### 운영 규칙

- **`RESOURCE_URI`의 `UI_VERSION`은 UI가 변경될 때마다 반드시 올린다.** 호스트가 `ui://` 리소스를 URI 기준으로 캐싱하므로, 버전을 올리지 않으면 배포는 성공했는데 옛 HTML이 계속 사용되어 수정이 반영되지 않은 것처럼 보인다.

## 기각된 대안

- 기존 리포의 `vercel-revival` 브랜치를 Preview 배포 후 Production으로 Promote하는 흐름. → `main` 직접 배포로 대체.
- 인증 없는 P1 서버에 OAuth를 추가하는 방식.
- raw image tool result fallback (원본 `index.js`의 base64 `imageCache`). → 모델 컨텍스트 오염.
- SSE transport와 process-memory session 맵. → stateless로 대체.
- `__emotion__:` 텍스트 태그를 UI가 파싱하는 방식. → `structuredContent`로 대체.
- `/img/:emotion` 정적 이미지 라우트. → Next.js 정적 import로 대체.
- 감정 확장 직후 3환경 × 4시나리오 전체 호환성 매트릭스를 채우는 순서. → 에셋 선택 로직이 들어오면 무효화되므로 M5로 이동.
- PC/Claude Desktop 대응. → 사용자가 사용하지 않으므로 검증 대상에서 제외한다. 검증 대상은 Claude.ai 웹과 모바일 앱이다.

## 현재 상태

**P1 (최소 Vertical Slice) 완료.** `main` @ `eec89d2`, 배포 `dpl_AWeFUhWCTPfp8nyBtQBy5rnjkQf3` READY (production).

검증된 것:

- Claude.ai 웹 — `express_emotion({ emotion: "happy" })` 호출 시 대화 본문에 이미지 inline 렌더 ✅
- Claude 모바일 앱 — 동일 ✅
- `description` 문자열이 이미지 하단에 표시됨 ✅

직전 실패 원인(해결됨): iframe 부트스트랩 3종이 누락되어 opaque origin에서 `/_next/static/*` 로드가 실패했고, 그 결과 React 하이드레이션이 일어나지 않아 `use-mcp-app` 브리지가 시작조차 하지 못했다. 브리지 자체의 결함이 아니었다. 증상은 UI가 `MCP host 연결 대기 중...`에 영원히 머무는 것이었다.

미완성된 것:

- 지원 감정은 `happy` **1개뿐이다.** 스키마가 `z.literal("happy")`이고 `assets/`에도 `happy.webp` 하나만 있다. 나머지 40개 파일은 아직 Railway 리포에만 있다.
- 감정 호출 규칙(언제 어떤 감정을 부를 것인가)이 정해지지 않았다.
- 말풍선·크기·로딩 깜빡임 등 UX 다듬기가 전혀 안 됐다.
- Railway 리포는 아직 아카이브되지 않았다.

알려진 경고(차단 아님): Next 16.1.6부터 `middleware` 파일 규약이 deprecated이고 `proxy`로 대체됐다. 현재는 그대로 동작한다.

## 다음 단계

마일스톤 M1–M5 기준이다. M1은 진행 중이고 M2가 다음 실행 항목이다.

1. **M1 — 기록 정리** (진행 중). 이 문서 갱신, Notion `🚀 Projects` 반영.
2. **M2 — 감정 31종 확장**. `z.literal` → `z.enum`, 에셋 정적 import 맵으로 선택. Railway 리포에서 에셋을 이식한다. 먼저 3종(`happy`/`sad`/`thinking`)으로 구조를 검증한 뒤 나머지를 일괄 추가한다. 정적 import를 쓰면 존재하지 않는 에셋이 빌드 타임에 걸린다.
3. **M3 — 호출 규칙 정립**. 원본 `CLAUDE.md`는 "모든 응답에서 반드시 호출"이었으나, 이를 그대로 이어받을지는 미결정이다. 사용자 결정 필요.
4. **M4 — UX 다듬기**. 말풍선, 크기, 여백, 로딩 깜빡임 방지. 변형 에셋(`_2`/`_3`) 랜덤 선택도 여기서.
5. **M5 — 안정화 및 전환**. cold start, 연속 호출, connector 재연결, 프로토콜 버전 호환성 검증. 통과 시 Railway 리포 아카이브, README 정리.
