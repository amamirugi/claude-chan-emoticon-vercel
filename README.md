# Claude-chan Emoticon

Claude.ai와 ChatGPT 같은 MCP App 호스트의 대화 본문에 클로드짱 이모티콘을 인라인으로 표시하는 Vercel-hosted MCP App 서버.

도구 결과에 이미지 바이너리를 넣지 않는다. MCP 도구는 감정 키와 설명만 `structuredContent`로 전달하고, 이미지는 호스트가 띄운 sandboxed iframe 안에서 렌더링한다.

- MCP endpoint — `/mcp` (stateless Streamable HTTP)
- 도구 — `express_emotion` 1개, read-only
- 감정 — 31종 / webp 41장
- 배포 — `main` push → Vercel Production 자동 배포
- 결정과 근거 — [`DECISIONS.md`](./DECISIONS.md)

## 등록

호스트별 운영 MCP endpoint:

Claude.ai:

```text
https://claude-chan-emoticon-vercel-git-main-amamirugis-projects.vercel.app/mcp
```

ChatGPT:

```text
https://claude-chan-emoticon-vercel.vercel.app/mcp
```

인증은 없다.

2026-08-15 Claude.ai에서는 canonical hostname의 도구 호출 자체는 성공하지만 MCP App 콘텐츠 렌더링만 실패하는 사례를 실측했다. 같은 Production deployment의 immutable hostname과 stable `main` branch alias는 정상 렌더링됐다. 정확한 Claude 내부 원인은 확정하지 않았으며, canonical hostname이 다시 정상화됐는지 확인하기 전까지 Claude는 위 `main` branch alias를 운영 주소로 사용한다. 자세한 격리 결과는 `DECISIONS.md`에 기록한다.

호스트는 서버 정의와 UI 리소스를 캐시할 수 있다. 서버/스키마 변경을 검증할 때는 커넥터 또는 앱을 다시 등록하고 새 대화에서 확인한다. Claude.ai에서는 새 배포 후 같은 URL을 삭제 후 재등록해야 변경이 반영되는 사례를 실제로 확인했다. 다만 이 절차가 canonical-hostname renderer failure 자체를 해결하지는 않았다.

ChatGPT에서 Vercel Preview를 직접 테스트하려면 ChatGPT가 Preview URL에 외부에서 접근할 수 있어야 한다. Vercel Authentication의 `Require Log In`이 Preview에 적용되어 있으면 MCP 요청이 `/mcp`까지 도달하지 않는다. 테스트 때문에 보호를 끈 경우 검증 후 다시 켤지 판단한다.

## 호출

```ts
express_emotion({
  emotion: "happy",                // 필수
  description: "잘 돼서 신나!",  // 선택, 최대 80자
});
```

`description`을 생략하면 감정의 한국어 라벨이 표시된다.

**언제 호출할지는 이 리포의 책임이 아니다.** 이 리포는 도구와 렌더링 동작만 정의한다. 자발 호출 빈도 같은 행동 정책은 각 호스트의 사용자 지침/개인화 설정에서 관리한다.

## 감정 목록

단검(†)이 붙은 5종은 그림이 3장씩 있으며, 각 도구 호출마다 하나를 새로 선택한다. 같은 호출의 input → result 전환 중에는 선택한 그림을 유지한다.

| 키 | 라벨 | 키 | 라벨 |
|---|---|---|---|
| `neutral` | 기본 | `laughing` | 폭소 |
| `happy` | 기쁨 | `nervous` | 초조 |
| `embarrassed` | 당황 | `pout` | 샐짐 |
| `sad` | 슬픔 | `speechless` | 말문막힘 |
| `angry` | 화남 | `wink` | 윙크 |
| `surprised` | 놀람 | `chu` | 뽀뽀 |
| `love` | 사랑 | `dead` | 사망 |
| `smug` | 득의 | `disappointed` | 실망 |
| `confused` | 혼란 | `disgusted` | 역겨움 |
| `crying` | 울음 | `facepalm` | 한심 |
| `excited` | 신남 | `gift` | 선물 |
| `proud` | 자랑 | `building` † | 작업 중 |
| `scared` | 무서움 | `coding` † | 코딩 |
| `sleepy` | 졸림 | `reading` † | 읽는 중 |
| `thinking` † | 생각 | `searching` † | 찾는 중 |
| `tired` | 피곳 | | |

## 구조

```text
app/
  mcp/route.ts                MCP 서버: tool/resource 등록
  page.tsx                    iframe UI: payload를 이미지와 라벨로 렌더
  layout.tsx                  최소 Next.js layout
  emotions.ts                 감정 키·한국어 라벨의 정본
  emotion-assets.ts           감정 키 → 정적 에셋 배열
  hooks/use-mcp-app.ts        React용 얇은 external-store hook
  mcp-app/
    bridge.ts                 MCP App 연결·이벤트·렌더 상태
    iframe-bootstrap.tsx      sandboxed iframe 호환 shim
proxy.ts                      iframe 자산/RSC 접근용 CORS
baseUrl.ts                    production/preview/local base URL 계산
assets/                       webp 41장
```

### 렌더 상태

`bridge.ts`가 호스트 이벤트를 하나의 **renderable payload**로 정규화한다.

- `ontoolinput`이 유효한 `emotion`을 주면 즉시 payload로 채택한다.
- `ontoolresult`의 `structuredContent`가 유효하면 같은 payload를 갱신한다.
- 일부 호스트가 유효한 input 뒤 비어 있거나 불완전한 result를 보내더라도 기존 payload를 지우지 않는다.
- `connected`는 sessionStorage에 저장하지 않는다. iframe이 새로 뜨면 실제 `app.connect()` 완료 여부를 다시 반영한다.
- `connectPromise`로 중복 연결 시도를 막는다.

변형 선택용 `variantSeed`는 `ontoolinput` 이벤트에서 `crypto.getRandomValues`로 생성한다. React render 안에서는 랜덤 함수를 호출하지 않고 seed로 순수하게 배열 인덱스를 계산한다.

## iframe 호환성

MCP App UI는 호스트의 opaque-origin sandboxed iframe에서 실행될 수 있다. 다음 세 요소가 함께 필요하다.

| 파일 | 역할 |
|---|---|
| `next.config.ts` | `assetPrefix: baseURL` |
| `proxy.ts` | 자산/RSC 요청 CORS 허용 |
| `app/mcp-app/iframe-bootstrap.tsx` | `<base href>`, hydration/history/fetch 호환 shim |

이 shim은 일반 UI 로직과 분리해 둔다. 이유를 확인하지 않고 일부만 제거하지 않는다. 빠지면 `/_next/static/*` 또는 RSC 요청이 잘못된 origin으로 가고, React 하이드레이션이나 MCP App bridge가 시작되지 않을 수 있다.

## 캐시와 새 배포

`ui://` 리소스 URI의 캐시 키는 사람이 버전 문자열을 올리지 않는다.

`app/mcp/route.ts`가 다음 순서로 자동 파생한다.

1. `VERCEL_GIT_COMMIT_SHA`
2. `VERCEL_URL`
3. `GITHUB_SHA`
4. 로컬 fallback `local`

따라서 Vercel의 새 revision은 자동으로 새 UI resource URI를 갖는다. 예전의 수동 `UI_VERSION` 증가 절차는 폐기됐다.

## 감정 추가하기

1. 에셋을 `assets/`에 추가한다.
2. `app/emotions.ts`의 `EMOTION_LABELS`에 키와 라벨을 추가한다.
3. `app/emotion-assets.ts`에 import와 맵 엔트리를 추가한다.
4. `npm run lint && npm run build`를 통과시킨다.
5. 배포 후 해당 호스트에서 커넥터/앱을 갱신하고 새 대화에서 확인한다.

`Record<Emotion, ...>`가 빠진 감정을 타입 오류로 잡고, 정적 import가 없는 파일을 빌드에서 잡는다. 변형 이미지는 별도 감정 키로 만들지 않고 같은 배열에 추가한다.

### 에셋 관리

`assets/`가 감정 에셋의 정본이다. 구 Railway 리포에서 복사하던 **Import emotion assets** workflow는 제거했다. 새 에셋은 이 리포에 직접 추가하고 일반 Git commit/push 흐름으로 관리한다.

바이너리 파일은 텍스트용 GitHub API wrapper를 통한 직접 업로드보다 일반 Git 전송을 우선한다. 필요하면 이 리포 내부에서 완결되는 전용 workflow를 별도로 만든다. 외부 리포를 에셋 원본으로 두지 않는다.

## 개발과 검증

의존성은 `package-lock.json`으로 고정한다.

```bash
npm ci
npm run lint
npm run build
npm run dev
```

`.github/workflows/verify.yml`도 `npm ci → lint → build`를 수행하고 production dependency audit를 함께 실행한다.

로컬에서 `http://localhost:3000`을 직접 열면 MCP 호스트가 없으므로 대기 문구가 보이는 것이 정상이다. 실제 host bridge 검증은 Preview 또는 Production MCP endpoint를 호스트에 등록해서 수행한다.

## 의존성 경계

현재 호환 조합은 다음과 같다.

- `@modelcontextprotocol/ext-apps` — `1.3.2`
- `@modelcontextprotocol/sdk` — `1.25.2`
- `mcp-handler` — `1.0.7`

`ext-apps 1.4.0+`는 MCP SDK `^1.29.0`을 요구하지만 `mcp-handler 1.0.7`은 SDK `1.25.2`를 peer dependency로 고정한다. 최신 `ext-apps`로 가려면 `mcp-handler`/MCP SDK 서버 스택도 함께 마이그레이션해야 한다. `mcp-handler 2.x`는 MCP SDK v2 기반의 breaking migration이므로 단순 dependency bump로 취급하지 않는다.

이 리포는 [`amamirugi/claude-chan-emoticon-railway`](https://github.com/amamirugi/claude-chan-emoticon-railway)를 대체하는 실행·에셋 정본이다. 구 리포에 대한 런타임·빌드·에셋 소스 의존성은 없다.