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

### iframe 부트스트랩 (필수)

MCP 호스트는 UI 리소스 HTML을 opaque-origin sandboxed iframe에서 실행할 수 있다. 다음 세 요소가 함께 필요하다.

- `next.config.ts` — `assetPrefix: baseURL`
- `proxy.ts` — iframe의 자산/RSC 요청에 필요한 CORS
- `app/mcp-app/iframe-bootstrap.tsx` — `<base href>`, hydration attribute 정리, history 패치, 외부 링크 처리, fetch rewrite

호환 shim은 `layout.tsx`에서 분리해 전용 모듈로 격리한다. 일반 UI 코드와 섞지 않는다. 일부 패치만 제거하면 증상이 MCP bridge 실패처럼 보일 수 있으므로 이유를 확인하지 않고 축소하지 않는다.

Next 16에서 middleware 파일 규약은 `proxy.ts`로 전환했다. 파일명과 named export를 함께 사용한다.

### 감정 시스템

- 감정 키는 **31개**이며 전부 활성화되어 있다.
- 원본 `index.js`의 `EMOTIONS` 배열과 `CLAUDE.md` 매핑표는 26개였지만 `assets/`에는 41개 파일 / 31개 고유 키가 있었다. `building`, `coding`, `gift`, `reading`, `searching` 5키는 원본에서 미사용이었다.
- 변형 에셋은 별도 감정 키가 아니라 같은 키의 선택지다. `building`, `coding`, `reading`, `searching`, `thinking` 5종이 각각 3장을 가진다.
- 변형 선택은 React render에서 랜덤 함수를 호출하지 않는다. `ontoolinput` 이벤트에서 `crypto.getRandomValues`로 `variantSeed`를 한 번 만들고, UI는 seed로 순수하게 배열 인덱스를 계산한다.
- 같은 도구 호출의 input → result 전환에서는 seed를 유지해 그림이 중간에 바뀌지 않는다. 다음 호출에서는 새 seed를 만든다.
- `description`을 생략하면 감정의 한국어 라벨을 기본값으로 표시한다. 이미지만 띄우는 경로는 없다.

### MCP App bridge 상태

- 호스트 이벤트 상태의 정본은 `app/mcp-app/bridge.ts`다. React hook은 external store를 구독하는 얇은 어댑터만 담당한다.
- `toolInput`과 `toolResult`를 별도 UI 상태로 유지하지 않는다. 화면이 필요한 것은 하나의 **renderable payload**다.
- `ontoolinput`에 유효한 string `emotion`이 있으면 즉시 payload로 채택한다.
- `ontoolresult`의 `structuredContent`가 유효할 때만 payload를 갱신한다. 빈 값이나 불완전한 result는 이미 렌더 가능한 payload를 지우지 않는다.
- `connected`는 sessionStorage에 저장하지 않는다. iframe이 새로 로드되면 실제 `app.connect()` 성공 여부에서 다시 계산한다.
- payload와 variant seed만 sessionStorage에 보존한다. 저장소가 없는 호스트에서도 실패를 삼키고 메모리 상태로 동작한다.
- 동시에 여러 `connect()`가 시작되지 않도록 `connectPromise`를 공유한다.

### 호출 정책

- **언제 호출할지는 이 리포의 책임이 아니다.** 툴 `description`은 사용법만 담당하고, 자발 호출 빈도 같은 행동 정책은 각 호스트의 사용자 지침/개인화 설정에서 관리한다.
- Claude에서 사용하던 호출 정책의 정본은 Claude 개인화 지침이다. 같은 정책을 README, 툴 description, 메모리에 중복하지 않는다.
- 감정 목록을 툴 `description`에 나열하지 않는다. `z.enum`이 JSON schema에 이미 넣으므로 중복이다.

### 코드 구조

- `app/emotions.ts` — 감정 키와 한국어 라벨의 정본. 이미지 import가 없어 서버·클라이언트 양쪽에서 사용 가능하다.
- `app/emotion-assets.ts` — 감정 키 → 비어 있지 않은 정적 에셋 배열. `Record<Emotion, ...>`로 감정 누락을 타입 단계에서 잡는다.
- `app/mcp-app/bridge.ts` — MCP App lifecycle, host event 정규화, render state, sessionStorage.
- `app/hooks/use-mcp-app.ts` — React `useSyncExternalStore` wrapper.
- `app/mcp-app/iframe-bootstrap.tsx` — host iframe compatibility shim.
- `app/page.tsx` — bridge snapshot을 받아 순수 렌더만 수행한다.

### UI resource cache

- 호스트가 `ui://` resource URI를 기준으로 캐시할 수 있으므로 revision마다 URI가 달라야 한다.
- 예전의 수동 `UI_VERSION` 증가는 폐기했다. 사람이 버전을 올리는 규칙은 실제로 한 번 누락됐고 재발 가능성이 있다.
- 현재 `RESOURCE_URI` cache key는 `VERCEL_GIT_COMMIT_SHA` → `VERCEL_URL` → `GITHUB_SHA` → `local` 순서로 자동 파생한다.
- 따라서 Vercel 새 배포와 GitHub CI revision은 자동으로 서로 다른 UI resource URI를 갖는다.

### 의존성과 재현성

- `package-lock.json`을 커밋하고 설치는 `npm ci`를 기준으로 한다.
- `.github/workflows/verify.yml`은 `npm ci → npm run lint → npm run build`를 수행한다. production dependency audit도 실행한다.
- ESLint 9 flat config(`eslint.config.mjs`)를 유지한다. 이전에는 `npm run lint` 스크립트만 있고 config가 없어 lint가 실제로 실행되지 않았다.
- 현재 MCP v1 호환 조합은 `@modelcontextprotocol/ext-apps 1.3.2`, `@modelcontextprotocol/sdk 1.25.2`, `mcp-handler 1.0.7`이다.
- `ext-apps 1.4.0+`는 SDK `^1.29.0`을 요구하지만 `mcp-handler 1.0.7`은 SDK `1.25.2`를 peer로 고정한다. 따라서 현재 서버 스택에서 가능한 ext-apps 상한은 1.3.2다.
- `mcp-handler 2.x`는 MCP SDK v2 / 새 server package와 registration API를 요구하는 breaking migration이다. 단순 dependency update로 섞지 않고 별도 작업으로 다룬다.

### 운영 규칙

- `main`은 production이므로 실험용 push를 하지 않는다.
- 도구 schema와 host metadata는 세션/커넥터 수준에서 캐시될 수 있다. 서버/스키마 변경 검증은 커넥터 또는 앱 갱신 후 새 대화에서 한다.
- Claude.ai에서 새 배포 후 같은 connector URL을 삭제 후 재등록해야 변경이 반영되는 사례를 실제로 확인했다.
- ChatGPT에서 Vercel Preview를 테스트할 때 Preview가 Vercel Authentication의 `Require Log In`으로 보호되어 있으면 ChatGPT 요청이 `/mcp`까지 도달하지 않는다. Preview 보호를 끄는 경우 테스트 범위로 한정하고 이후 복구 여부를 판단한다.
- 바이너리 에셋은 GitHub API로 직접 올리지 않는다. `.github/workflows/import-assets.yml`로 구 Railway 리포에서 복사한다.
- 호스트가 도구 목록을 압축할 수 있으므로 tool description 첫 줄은 단독으로 읽혀도 의미가 통해야 한다.

### 구 리포 처리

- `claude-chan-emoticon-railway`는 아카이브/삭제/비공개 전환하지 않는다.
- 실행 정본은 이 Vercel 리포지만 에셋 동기화 workflow가 Railway 리포를 source로 사용한다. 이 의존성을 제거하기 전까지 구 리포는 보존한다.

## 2026-08-15 ChatGPT 호환성 사건

### 증상

ChatGPT에서 `express_emotion({ emotion: "chu", description: "쪽♡" })` 호출 시:

1. tool input 단계에서 이미지와 라벨이 정상 표시됨
2. 잠시 뒤 이미지가 사라짐
3. UI가 `감정 호출을 기다리는 중...`으로 복귀

초기 렌더가 성공했으므로 자산/iframe bootstrap 자체보다 후속 host event가 상태를 덮는 경로를 우선 의심했다.

### 원인과 수정

ChatGPT에서는 tool input 뒤 도착하는 `ontoolresult`의 UI-visible `structuredContent`가 비어 있거나 렌더 불가능한 경우가 있었다. 기존 코드는 non-null result를 우선해 유효한 input을 덮었다.

수정 원칙:

- 유효한 `emotion`이 있는 payload만 렌더 상태로 채택
- 빈/incomplete result는 마지막 renderable payload를 지우지 않음
- host 차이를 `page.tsx` 조건문으로 누적하지 않고 bridge에서 정규화

이 수정 후 사용자가 ChatGPT에서 이미지가 유지되는 것을 확인했다.

### 간헐적 `MCP host 연결 대기 중...`

서버 runtime log에서는 `/mcp`, 정적 chunk, image 요청이 정상 처리되어 Vercel 함수 지연보다는 iframe → host `app.connect()` handshake 편차가 유력했다.

`ext-apps 1.0.1 → 1.3.2`로 올린 Preview에서 사용자는 연결 대기 체감이 개선됐다고 보고했다. 1.7.5 직접 상승은 peer dependency 충돌로 빌드 불가했고, `mcp-handler`까지 함께 바꾸는 것은 별도 migration으로 분리했다.

### Vercel Preview 등록 실패

처음 ChatGPT custom MCP 등록 자체가 실패했을 때 Vercel runtime에는 ChatGPT `/mcp` 요청이 전혀 없었다. Preview의 Standard Protection / `Require Log In`을 끄자 등록이 성공했다. 즉 이 실패는 MCP initialize가 아니라 Vercel edge protection에서 발생했다.

## cleanup-v1에서 발견된 잠복 부채

- lockfile이 없어 동일 커밋 재빌드의 dependency graph 재현성이 없었다. → `package-lock.json` 추가.
- ESLint 9인데 flat config가 없어 `npm run lint`가 즉시 실패했다. → `eslint.config.mjs` 추가.
- `Math.random()`을 render/useMemo 안에서 호출해 React purity rule을 위반했다. → event-time variant seed로 변경.
- 기존 `useMemo([emotion])`는 같은 감정을 연속 호출할 때 새 variant를 고르지 않을 수 있었다. → 호출마다 seed 생성.
- bridge lifecycle, tool input/result, storage, React store가 한 파일에 결합되어 있었다. → bridge와 React hook 분리.
- iframe compatibility patch가 `layout.tsx`에 섞여 있었다. → 전용 shim 모듈로 격리.
- 수동 `UI_VERSION`은 과거 실제 누락 사례가 있었다. → deployment-derived cache key로 자동화.

## 기각/보류된 대안

- raw image tool result fallback → 모델 컨텍스트 오염 때문에 사용하지 않는다.
- SSE transport와 process-memory session map → stateless Streamable HTTP 유지.
- `__emotion__:` 텍스트 태그를 UI가 파싱 → `structuredContent` 유지.
- `/img/:emotion` 라우트 → Next.js static import 유지.
- `description` 생략 시 라벨 없는 이미지 → 기록 가독성을 위해 라벨 유지.
- 호출 정책을 프로젝트 메모리/README/tool description에 중복 → 행동 정책은 호스트 개인화에 둔다.
- 변형 에셋을 `thinking_2` 같은 별도 감정 키로 승격 → 같은 키의 variants로 유지.
- `ext-apps 1.7.5`만 강제로 설치하거나 `--legacy-peer-deps` 사용 → peer 불일치를 숨기므로 거부.
- cleanup 과정에서 `mcp-handler 2.x`까지 동시에 migration → 원인/회귀 범위가 커지므로 별도 작업으로 분리.
- 현재 `proxy.ts`의 광범위 CORS 축소와 `fetchPageHtml()` self-fetch 제거 → 개선 후보지만 host compatibility에 직접 닿으므로 이번 cleanup에는 섞지 않는다.
- Claude Desktop 대응 → 현재 사용 범위가 아니므로 검증 대상에서 제외.

## 실패 사례에서 유지할 교훈

### 행동 규칙을 메모리에 두면 동작하지 않는다

Claude 자발 호출 정책을 메모리에 두었을 때 실제 호출되지 않았고, user preference로 옮기자 동작했다.

**일반화: 메모리는 사실·선호·배경에 쓰고, 반드시 수행되어야 하는 행동 규칙은 지침/개인화 설정에 둔다.**

### deferred 도구는 정책만으로 부족할 수 있다

도구가 on-demand/deferred면 이름과 축약 설명만 보일 수 있다. 필요한 경우 host가 도구 정의를 먼저 로드할 수 있도록 행동 정책을 설계한다.

### 관찰하지 않은 것을 `실측 확인`으로 적지 않는다

과거 이 문서에 connector 재등록 불필요를 `실측 확인`이라고 잘못 적은 적이 있었다. 실제로는 사용자 행동을 확인하지 않은 추론이었다. 관찰과 추론을 분리한다.

이번 2026-08-15 cleanup에서도 동일 원칙을 적용한다. Claude quota 소진으로 새 cleanup Preview를 Claude에서 직접 재검증하지 못했다. 사용자가 기존 두 호환성 수정의 Claude 회귀를 이번 작업에서는 **통과로 간주하도록 승인**했다. 따라서 이를 독립적인 Claude 실측 결과로 기록하지 않는다.

## 현재 상태

### Production (`main`)

- `main`은 기존 M5 production 상태를 유지한다.
- cleanup 작업 중 production branch에는 push/merge하지 않았다.

### `cleanup-v1`

기준선은 ChatGPT에서 동작 확인된 host-result 방어 패치 + `ext-apps 1.3.2`다.

추가 완료:

- `package-lock.json` / reproducible `npm ci`
- GitHub Actions verify CI
- ESLint 9 flat config
- MCP bridge 상태 격리와 renderable payload 단일화
- event-time variant seed
- deployment-derived UI resource cache key
- iframe compatibility shim 격리
- README / DECISIONS 현실 정렬

CI에서 `npm ci`, lint, build, production dependency audit가 모두 통과했다. Vercel Preview도 READY이며 `/mcp` route가 존재함을 확인했다.

ChatGPT에서는 cleanup 이전의 두 핵심 호환성 수정(빈 result 방어, ext-apps 1.3.2)이 잘 동작한다고 사용자가 확인했다. 전체 `cleanup-v1` 최종 Preview의 실제 ChatGPT smoke test는 production 채택 전 마지막 확인 항목이다.

## 다음 단계

1. `cleanup-v1` 최종 Preview를 ChatGPT에 별도 test connector/app로 등록해 `chu`와 variant 감정 1종을 smoke test한다.
2. 이미지 유지, 연결, 같은 감정 연속 호출 시 variant 선택, description 표시를 확인한다.
3. 문제가 없으면 `main` production 채택 여부를 사용자가 명시적으로 결정한다.
4. production 반영 후 필요하면 Notion `🚀 Projects` 상태를 현재 구조에 맞게 갱신한다.

후속 후보:

- `mcp-handler 2.x` / MCP SDK v2 migration 조사 — 별도 작업
- CORS scope 축소 — host 회귀 테스트를 포함한 별도 작업
- `fetchPageHtml()` self-fetch 제거 가능성 검토
- 말풍선/이미지 크기/여백 — 실제 불편이 생길 때
- 새 감정 에셋 — 필요할 때
