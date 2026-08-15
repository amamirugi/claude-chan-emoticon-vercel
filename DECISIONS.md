# DECISIONS — Claude-chan Emoticon Vercel

> 이 문서는 이 대화를 보지 못한 다른 AI 인스턴스가 읽는다고 가정하고 작성한다.
> 프로젝트 **상태**의 정본은 Notion `🚀 Projects`이고, 이 문서는 **결정과 근거**의 정본이다.

## 확정된 결정

### 구조

- 이 리포는 기존 Railway 리포(`amamirugi/claude-chan-emoticon-railway`)를 대체하는 실행 정본이다.
- 기본 브랜치 `main`은 Vercel Production Branch다. `main` push는 즉시 프로덕션 배포이므로 실험 브랜치에서 검증한 뒤 명시적으로 채택한다.
- MCP endpoint는 `/mcp` 단일이며 stateless Streamable HTTP만 사용한다.
- 결과 이미지는 raw MCP `type: image`가 아니라 MCP App iframe 내부에서 렌더링한다.
- MCP 도구는 `structuredContent`로 감정 키와 description만 전달한다. 모델 컨텍스트에 이미지 데이터를 넣지 않는다.
- 에셋은 이 리포에 자체 포함하며 런타임 외부 이미지 호스팅에 의존하지 않는다.
- 활성 호스트 범위는 Claude.ai와 ChatGPT다. 호스트별 편차는 서버 계약을 분기하기보다 bridge 호환 계층에서 흡수한다.

### iframe 부트스트랩

MCP 호스트는 UI 리소스 HTML을 opaque-origin sandboxed iframe에서 실행할 수 있다. 다음 세 요소를 함께 유지한다.

- `next.config.ts` — `assetPrefix: baseURL`
- `proxy.ts` — iframe의 자산/RSC 요청에 필요한 CORS
- `app/mcp-app/iframe-bootstrap.tsx` — `<base href>`, hydration attribute 정리, history 패치, 외부 링크 처리, fetch rewrite

호환 shim은 일반 UI 코드와 분리한다. 일부 패치만 제거하면 증상이 bridge 실패처럼 보일 수 있으므로 이유를 확인하지 않고 축소하지 않는다.

### CORS 경계

- CORS 적용 경로는 `/`, `/_next/:path*`, `/mcp`로 제한한다.
- 페이지와 정적 자산은 `GET,OPTIONS`, MCP endpoint는 `GET,POST,OPTIONS`만 허용한다.
- `Access-Control-Allow-Origin: *`는 유지한다. MCP App iframe이 opaque/null origin에서 실행될 수 있어 특정 web origin으로 고정하지 않는다.
- `Access-Control-Allow-Headers: *`도 유지한다. MCP/Next RSC host가 보내는 커스텀 헤더 집합을 애플리케이션이 불필요하게 재정의하지 않는다.

### MCP App HTML 전달

- `app/mcp/route.ts`의 `fetchPageHtml()` self-fetch는 현재 구조에서 의도된 경계다.
- Next가 생성한 실제 hydration HTML과 배포별 asset URL을 MCP `resources/read`의 `text`로 재사용하기 위해 배포 자신의 `/`를 읽는다.
- Vercel의 공식 Next.js Apps SDK starter도 동일하게 배포 페이지를 fetch해 widget HTML로 전달하는 패턴을 사용한다.
- self-fetch를 완전히 제거하려면 MCP App UI를 별도 standalone/single-file bundle로 분리해야 하므로 cleanup 수준의 최적화로 취급하지 않는다.

### 감정 시스템

- 감정 키는 **31개**이며 전부 활성화되어 있다.
- `building`, `coding`, `gift`, `reading`, `searching` 5키는 원본에서 미사용이었으나 현재 복구되어 있다.
- 변형 에셋은 별도 감정 키가 아니라 같은 키의 선택지다. `building`, `coding`, `reading`, `searching`, `thinking` 5종이 각각 3장을 가진다.
- 변형 선택은 React render에서 랜덤 함수를 호출하지 않는다. `ontoolinput` 이벤트에서 `crypto.getRandomValues`로 `variantSeed`를 만들고 UI는 seed로 배열 인덱스를 계산한다.
- 같은 도구 호출의 input → result 전환에서는 seed를 유지한다. 다음 호출에서는 새 seed를 만든다.
- `description`을 생략하면 감정의 한국어 라벨을 기본값으로 표시한다.

### MCP App bridge 상태

- 호스트 이벤트 상태의 정본은 `app/mcp-app/bridge.ts`다. React hook은 external store 구독 어댑터만 담당한다.
- `toolInput`과 `toolResult`를 UI에서 따로 우선순위 계산하지 않는다. 화면에는 하나의 **renderable payload**만 노출한다.
- `ontoolinput`에 유효한 string `emotion`이 있으면 즉시 payload로 채택한다.
- `ontoolresult`의 `structuredContent`가 유효할 때만 payload를 갱신한다. 빈 값이나 불완전한 result는 이미 렌더 가능한 payload를 지우지 않는다.
- `connected`는 sessionStorage에 저장하지 않는다. 새 iframe은 실제 `app.connect()` 성공 여부에서 다시 계산한다.
- payload와 variant seed만 sessionStorage에 보존한다. 저장소가 없는 호스트에서도 메모리 상태로 동작한다.
- 동시에 여러 `connect()`가 시작되지 않도록 `connectPromise`를 공유한다.

### 호출 정책

- **언제 호출할지는 이 리포의 책임이 아니다.** 툴 `description`은 사용법만 담당한다.
- 자발 호출 빈도 같은 행동 정책은 각 호스트의 사용자 지침/개인화 설정에서 관리한다.
- Claude에서 사용하던 호출 정책의 정본은 Claude 개인화 지침이다. README, 툴 description, 메모리에 중복하지 않는다.
- 감정 목록은 `z.enum`이 JSON schema에 제공하므로 툴 description에 중복 나열하지 않는다.

### 코드 구조

- `app/emotions.ts` — 감정 키와 한국어 라벨의 정본
- `app/emotion-assets.ts` — 감정 키 → 비어 있지 않은 정적 에셋 배열
- `app/mcp-app/bridge.ts` — MCP App lifecycle, host event 정규화, render state, sessionStorage
- `app/hooks/use-mcp-app.ts` — React `useSyncExternalStore` wrapper
- `app/mcp-app/iframe-bootstrap.tsx` — host iframe compatibility shim
- `app/page.tsx` — bridge snapshot을 받아 순수 렌더

### UI resource cache

- 호스트가 `ui://` resource URI를 기준으로 캐시할 수 있으므로 revision마다 URI가 달라야 한다.
- 수동 `UI_VERSION` 증가는 폐기했다. 과거 실제 누락 사례가 있었고 재발 가능성이 있었다.
- `RESOURCE_URI` cache key는 `VERCEL_GIT_COMMIT_SHA` → `VERCEL_URL` → `GITHUB_SHA` → `local` 순서로 자동 파생한다.

### 의존성과 재현성

- `package-lock.json`을 커밋하고 설치는 `npm ci`를 기준으로 한다.
- `.github/workflows/verify.yml`은 모든 branch push와 PR에서 `npm ci → npm run lint → npm run build`를 수행하고 production dependency audit도 실행한다.
- ESLint 9 flat config(`eslint.config.mjs`)를 유지한다.
- 현재 MCP v1 호환 조합은 `@modelcontextprotocol/ext-apps 1.3.2`, `@modelcontextprotocol/sdk 1.25.2`, `mcp-handler 1.0.7`이다.
- `ext-apps 1.4.0+`는 SDK `^1.29.0`을 요구하지만 `mcp-handler 1.0.7`은 SDK `1.25.2`를 peer로 고정한다. 현재 서버 스택에서 가능한 ext-apps 상한은 1.3.2다.
- `mcp-handler 2.x`는 MCP SDK v2 / 새 server package와 registration API를 요구하는 breaking migration이다.
- 2026-08-15 기준 최신 `ext-apps 1.7.5`도 MCP SDK v1 package를 peer로 사용하고 있고, 공식 `modelcontextprotocol/ext-apps#702`에서 v2 migration이 진행 중이다. upstream 공식 지원이 나오기 전에는 CCE가 자체 호환층을 만들지 않는다.

### 운영 규칙

- `main`은 production이므로 실험용 push를 하지 않는다.
- 도구 schema와 host metadata는 세션/커넥터 수준에서 캐시될 수 있다. 서버/스키마 변경 검증은 커넥터 또는 앱 갱신 후 새 대화에서 한다.
- Claude.ai에서 새 배포 후 같은 connector URL을 삭제 후 재등록해야 변경이 반영되는 사례를 실제로 확인했다.
- ChatGPT에서 Vercel Preview가 `Require Log In`으로 보호되어 있으면 ChatGPT 요청이 `/mcp`까지 도달하지 않을 수 있다.
- 바이너리 에셋은 GitHub API로 직접 올리지 않는다. `.github/workflows/import-assets.yml`로 구 Railway 리포에서 복사한다.

### 구 리포 처리

- `claude-chan-emoticon-railway`는 아카이브/삭제/비공개 전환하지 않는다.
- 실행 정본은 이 Vercel 리포지만 에셋 동기화 workflow가 Railway 리포를 source로 사용한다. 이 의존성을 제거하기 전까지 보존한다.

## 2026-08-15 ChatGPT 호환성 사건

### 증상

ChatGPT에서 `express_emotion` 호출 시 tool input 단계에서는 이미지가 표시됐지만, 뒤이어 이미지가 사라지고 UI가 `감정 호출을 기다리는 중...`으로 돌아오는 문제가 있었다.

### 원인과 수정

ChatGPT에서는 tool input 뒤 도착하는 `ontoolresult`의 UI-visible `structuredContent`가 비어 있거나 렌더 불가능한 경우가 있었다. 기존 코드는 non-null result를 우선해 유효한 input을 덮었다.

수정 원칙:

- 유효한 `emotion`이 있는 payload만 렌더 상태로 채택
- 빈/incomplete result는 마지막 renderable payload를 지우지 않음
- host 차이를 `page.tsx` 조건문으로 누적하지 않고 bridge에서 정규화

이 수정 후 사용자가 ChatGPT에서 이미지가 유지되는 것을 확인했다.

### 간헐적 `MCP host 연결 대기 중...`

서버 runtime log에서는 `/mcp`, 정적 chunk, image 요청이 정상 처리되어 Vercel 함수 실패보다는 iframe → host `app.connect()` handshake 편차를 우선 의심했다.

`ext-apps 1.0.1 → 1.3.2` Preview에서 사용자는 연결 대기 체감이 개선됐다고 보고했다. 1.7.5 직접 상승은 peer dependency 충돌로 빌드 불가했고, `mcp-handler`까지 함께 바꾸는 것은 별도 migration으로 분리했다.

### Vercel Preview 등록 실패

처음 ChatGPT custom MCP 등록 자체가 실패했을 때 Vercel runtime에는 ChatGPT `/mcp` 요청이 없었다. Preview의 `Require Log In` 보호를 해제한 뒤 등록이 성공했다. 이 실패는 MCP initialize가 아니라 Vercel edge protection 단계였다.

## cleanup-v1에서 발견·해결한 잠복 부채

- lockfile 부재 → `package-lock.json` 추가
- ESLint 9 config 부재 → `eslint.config.mjs` 추가
- render/useMemo 내부 `Math.random()` → event-time variant seed로 변경
- 같은 감정 연속 호출 시 variant 재선택이 안 될 수 있던 구조 → 호출마다 새 seed 생성
- bridge lifecycle, tool input/result, storage, React store 결합 → bridge와 React hook 분리
- iframe compatibility patch가 `layout.tsx`에 혼재 → 전용 shim 모듈로 격리
- 수동 `UI_VERSION` 누락 가능성 → deployment-derived cache key로 자동화
- 모든 route에 과도하게 열려 있던 CORS → MCP App에 필요한 경로/메서드로 축소
- CI가 `cleanup-v1` push에만 묶여 있던 설정 → 모든 branch push/PR 검증으로 일반화

## 기각/보류된 대안

- raw image tool result fallback → 모델 컨텍스트 오염 때문에 사용하지 않는다.
- SSE transport와 process-memory session map → stateless Streamable HTTP 유지.
- `__emotion__:` 텍스트 태그 파싱 → `structuredContent` 유지.
- `/img/:emotion` 라우트 → Next.js static import 유지.
- 변형 에셋을 별도 감정 키로 승격 → 같은 키의 variants로 유지.
- `ext-apps 1.7.5` 강제 설치 또는 `--legacy-peer-deps` → peer 불일치를 숨기므로 거부.
- cleanup과 `mcp-handler 2.x` migration 동시 수행 → 원인/회귀 범위가 커지고 upstream `ext-apps`가 아직 v2로 이행 중이므로 보류.
- `fetchPageHtml()` self-fetch 제거 → 현재 Vercel/Next MCP App 구조의 의도된 HTML 전달 패턴이다. 별도 standalone UI bundle로 재설계할 명확한 이유가 생기기 전에는 유지한다.

## 기록 원칙

- 관찰하지 않은 것을 `실측 확인`으로 적지 않는다.
- 이번 2026-08-15 작업에서는 Claude quota 소진으로 최종 cleanup Preview를 Claude에서 새로 실측하지 못했다.
- 사용자가 이번 change set의 Claude 회귀를 **통과로 간주하도록 승인**했으므로 채택 판단에는 사용했지만, 독립적인 Claude 실측 결과로 기록하지 않는다.

## 현재 상태

- PR #1 `refactor: stabilize multi-host MCP app bridge`를 `main`에 squash merge했다.
- PR #2 `refactor: narrow MCP app CORS surface`를 `main`에 squash merge했다.
- 최신 기능 Production 채택 커밋은 `1f4c0692d20ddde8bad62838d5ce5f28f105b865`다.
- PR #2 Vercel Production 배포가 `READY`임을 확인했다.
- canonical `https://claude-chan-emoticon-vercel.vercel.app/mcp`가 `/mcp` route로 매칭되며 GET에는 의도된 JSON-RPC 405를 반환한다.
- Production `/mcp` 응답은 CORS method로 `GET,POST,OPTIONS`를 광고한다.
- PR #1과 PR #2 모두 merge 전 CI에서 `npm ci`, lint, build, production dependency audit가 통과했다.
- 최종 `cleanup-v1` Preview와 CORS Preview를 ChatGPT에서 각각 smoke test했고 사용자가 정상 동작한다고 확인했다.
- CCE renovation v1에서 식별한 필수 구조 부채는 정리 완료했다.

## 다음 단계

**CCE renovation v1은 완료 상태다.** Production을 실사용하며 Claude/ChatGPT host 회귀가 나타나는지만 관찰한다.

후속 작업은 새 필요가 생길 때 별도 범위로 연다.

- `modelcontextprotocol/ext-apps#702` 및 MCP Apps의 SDK v2 공식 지원이 완료된 뒤 `mcp-handler 2.x` / MCP SDK v2 migration 재검토
- 말풍선/이미지 크기/여백 조정
- 새 감정 에셋 추가
