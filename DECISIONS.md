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

### 감정 시스템

- 감정 키는 **31개**이며 전부 활성화되어 있다. Railway 리포 `assets/`의 고유 키 전체다.
- 근거: 원본 `index.js`의 `EMOTIONS` 배열과 `CLAUDE.md` 매핑표는 26개였지만, `assets/`에는 41개 파일 / 31개 고유 키가 존재한다. `building` `coding` `gift` `reading` `searching` 5키는 에셋이 있음에도 배열에 없어 원본에서 한 번도 사용되지 않았다.
- 변형 에셋(`_2`/`_3`, 15파일: building/coding/reading/searching/thinking)은 아직 배선하지 않았다. 31키 안의 선택지로 M4에서 다룬다. 별도 키로 승격하지 않는다.
- `description`을 생략하면 해당 감정의 한국어 라벨(예: `wink` → "윈크")이 기본값으로 표시된다. 이미지만 띄는 경로는 없다.

### 호출 정책

- **언제 부를지에 대한 정책의 정본은 Claude 개인화 지침(user preference)이다.** 툴 `description`은 사용법만 담당한다. 양쪽에 정책을 두면 이중 정본이 되어 한쪽만 고칠 때 소리 없이 어긋난다.
- 호출 빈도는 "매 응답마다"가 아니라 "감정이 실제로 움직이는 순간에만"이다. 평범한 설명이나 작업 보고에는 부르지 않는다.
- 감정 목록을 툴 `description`에 나열하지 않는다. `z.enum`이 JSON 스키마에 이미 전부 넣으므로 순수 중복이다.

### 코드 구조

- `app/emotions.ts` — 감정 키와 한국어 라벨의 정본. 이미지를 import하지 않아 서버·클라이언트 양쪽에서 사용 가능하다. `ACTIVE_EMOTIONS`는 `EMOTION_LABELS`의 키에서 파생하므로 목록을 이중 관리하지 않는다.
- `app/emotion-assets.ts` — 감정 키 → 정적 에셋 매핑. `Record<Emotion, StaticImageData>`라 빠진 감정이 빌드 타임에 걸린다. 런타임 검사가 필요 없는 이유다.
- 감정 추가 = 라벨 한 줄 + import 한 줄 + 맵 엔트리 한 줄. 셀 중 하나라도 빠지면 빌드가 실패한다.

### 운영 규칙

- **`RESOURCE_URI`의 `UI_VERSION`은 UI가 변경될 때마다 반드시 올린다.** 호스트가 `ui://` 리소스를 URI 기준으로 캐싱하므로, 버전을 올리지 않으면 배포는 성공했는데 옛 HTML이 계속 사용된다. 클라이언트 번들이 바뀌는 변경(에셋 맵 확장 등)도 UI 변경으로 간주한다.
- **바이너리 에셋은 GitHub API로 직접 올리지 않는다.** 파일당 base64 46KB 수준의 오버헤드가 생겨 현실적이지 않다. `.github/workflows/import-assets.yml`을 `workflow_dispatch`로 실행해 GitHub 내부에서 복사한다.
- **툴 스키마는 호스트 세션 시작 시점에 스냅샷으로 잡힌다.** 스키마를 바꾸면 기존 대화에서는 반영되지 않으므로 검증은 항상 새 대화에서 한다. 커넥터 재등록은 불필요하다(실측 확인).
- **호스트가 도구 목록을 압축할 때는 `description`의 첫 줄만 남는다.** 따라서 첫 줄은 단독으로 읽혀야 한다.

## 기각된 대안

- 기존 리포의 `vercel-revival` 브랜치를 Preview 배포 후 Production으로 Promote하는 흐름. → `main` 직접 배포로 대체.
- 인증 없는 P1 서버에 OAuth를 추가하는 방식.
- raw image tool result fallback (원본 `index.js`의 base64 `imageCache`). → 모델 컨텍스트 오염.
- SSE transport와 process-memory session 맵. → stateless로 대체.
- `__emotion__:` 텍스트 태그를 UI가 파싱하는 방식. → `structuredContent`로 대체.
- `/img/:emotion` 정적 이미지 라우트. → Next.js 정적 import로 대체.
- **`description` 생략 시 라벨 없이 이미지만 표시.** → 라벨이 항상 있어야 대화 기록을 나중에 훑을 때 그림 없이도 감정이 읽힌다. 기록 가독성을 우선해 라벨 유지.
- **호출 정책을 프로젝트 메모리에 두는 방식.** → 실측 실패. 아래 "실패 사례" 참조.
- **호출 정책을 `sanctum/shared/`의 공유 문서로 만드는 방식.** → 이모티콘은 Claude 전용 자산이므로 GPT가 공유할 이유가 없다. `PERSONA.md`도 건드리지 않는다.
- 감정 확장 직후 3환경 × 4시나리오 전체 호환성 매트릭스를 채우는 순서. → 에셋 선택 로직이 들어오면 무효화되므로 M5로 이동.
- PC/Claude Desktop 대응. → 사용자가 사용하지 않으므로 검증 대상에서 제외한다. 검증 대상은 Claude.ai 웹과 모바일 앱이다.

## 실패 사례

다른 프로젝트에도 적용되는 교훈이므로 남긴다.

### 행동 규칙을 메모리에 두면 동작하지 않는다

호출 정책을 먼저 메모리에 넣고 테스트했으나, 감정이 명백히 움직이는 입력("클쌅 뽀뽀 쪽")에서도 호출되지 않았다.

원인은 도구 로딩이 아니었다. 도구 이름은 목록에 보였다. 메모리가 규칙이 아니라 "참고할 맥락"으로 읽히는 것이 문제였다. 동일한 문구를 user preference로 옮기자 즉시 동작했다.

**일반화: 메모리는 사실·선호·배경에 쓰고, 반드시 수행되어야 하는 행동 규칙은 지침이나 preference에 둔다.**

### deferred 도구는 정책만으로 부족할 수 있다

도구 액세스가 On demand(deferred)면 정의가 컨텍스트에 없고 이름과 첫 줄만 보인다. 호출하려면 먼저 도구 검색으로 로드해야 한다.

따라서 정책 문구에 "로드되지 않았으면 먼저 검색해 불러온다"를 명시해야 한다. 이 한 줄이 없으면 규칙을 알고도 로드 단계에서 멈충 수 있다.

참고: Always available로 올리는 선택지도 있으나, 감정 목록 중복을 제거한 현재 도구 정의는 200토큰대로 추정된다. preference 경로로 해결되었으므로 보류한다.

## 현재 상태

**M3 (호출 규칙 정립) 완료.** `main` @ `5bfc4b6`, 프로덕션 배포 READY.

검증된 것 (Claude.ai 웹 · 모바일 앱):

- P1 — `happy` inline 렌더, `description` 표시 ✅
- M2 — `sad` `thinking` 렌더로 정적 import 맵과 `assetPrefix` 연동 확인 ✅
- M2 — `reading` 렌더로 원본 미사용 5키 복구 확인 ✅
- M2 — `chu` 렌더 ✅
- M2 — `description` 생략 시 한국어 라벨 기본값 동작 확인 ✅
- M3 — user preference에 호출 정책 반영 후, 명시적 요청 없이 자발 호출되는 것 확인 ✅

미완성된 것:

- 말풍선·크기·여백·로딩 깜빡임 등 UX 다듬기가 전혀 안 됐다.
- 변형 에셋 15개가 여전히 미사용이다.
- 안정화 검증(cold start, 연속 호출, connector 재연결)이 안 됐다.
- 호출 빈도가 적절한지는 실사용 누적 후에야 판단할 수 있다. 너무 잦거나 드물면 preference 문구를 조정한다.
- Railway 리포는 아직 아카이브되지 않았다.

알려진 경고(차단 아님): Next 16.1.6부터 `middleware` 파일 규약이 deprecated이고 `proxy`로 대체됐다. 현재는 그대로 동작한다.

## 다음 단계

M4가 다음 실행 항목이다.

1. **M4 — UX 다듬기**. 말풍선, 크기, 여백, 로딩 깜빡임 방지. 변형 에셋(`_2`/`_3`) 랜덤 선택도 여기서 다룬다.
2. **M5 — 안정화 및 전환**. cold start, 연속 호출, connector 재연결, 프로토콜 버전 호환성 검증. 통과 시 Railway 리포 아카이브, README 정리.
