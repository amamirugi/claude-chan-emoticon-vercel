# Claude-chan Emoticon

Claude.ai 대화 본문에 클로드짱 이모티콘을 표시하는 MCP App 서버.

도구 결과에 이미지가 딸려오는 방식이 아니라, 대화 UI의 일부처럼 인라인으로 렌더링된다.

- MCP endpoint — `/mcp` (stateless Streamable HTTP)
- 감정 — 31종, 에셋 41장
- 배포 — `main` push → Vercel 프로덕션 자동 배포
- 결정과 근거는 [`DECISIONS.md`](./DECISIONS.md)에 있다

## 사용법

### Claude.ai에 등록

설정 → 커넥터 → 사용자 지정 커넥터 추가에 프로덕션 도메인의 `/mcp`를 넣는다.

```
https://claude-chan-emoticon-vercel.vercel.app/mcp
```

인증은 없다. 도구는 `express_emotion` 하나이며 읽기 전용이다.

### 호출

```ts
express_emotion({
  emotion: "happy",                // 필수. 아래 감정 목록 참조
  description: "잘 돼서 신나!",  // 선택. 최대 80자
});
```

`description`을 생략하면 감정의 한국어 라벨이 대신 표시된다. 이미지만 띄우는 경로는 없다.

**언제 부를지에 대한 정책은 이 리포에 없다.** Claude 개인화 지침(user preference)이 정본이다. 양쪽에 두면 이중 정본이 된다.

### 감정 목록

단검(†)이 붙은 5종은 그림이 3장씩 있으며, 호출마다 무작위로 하나가 선택된다.

| 키 | 라벨 | 키 | 라벨 |
|---|---|---|---|
| `neutral` | 기본 | `laughing` | 폭소 |
| `happy` | 기쁨 | `nervous` | 초조 |
| `embarrassed` | 당황 | `pout` | 샐짐 |
| `sad` | 슬픔 | `speechless` | 말문막힘 |
| `angry` | 화남 | `wink` | 윈크 |
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

```
app/
  mcp/route.ts        MCP 서버. 도구와 UI 리소스 등록
  page.tsx            iframe 안에서 도는 UI
  layout.tsx          IframeBootstrap — 아래 "주의" 참조
  emotions.ts         감정 키·라벨 정본
  emotion-assets.ts   감정 키 → 정적 에셋 배열
  hooks/use-mcp-app.ts  호스트와의 postMessage 브리지
proxy.ts              전 경로 CORS 허용
assets/               webp 41장
```

모델 컨텍스트에는 이미지 데이터가 들어가지 않는다. 도구는 `structuredContent`로 감정 키만 넘기고, 그림 선택과 렌더링은 iframe 안에서 일어난다.

## 주의

### iframe 부트스트랩 3종은 건드리지 말 것

MCP 호스트는 UI HTML을 **opaque origin** iframe에서 실행한다. 상대 경로가 이 서버로 해석되지 않으므로 다음 3개가 **모두** 필요하다.

| 파일 | 역할 |
|---|---|
| `next.config.ts` | `assetPrefix: baseURL` |
| `proxy.ts` | 전 경로 CORS 허용 |
| `app/layout.tsx` | `IframeBootstrap` — `<base href>`, history·fetch 패치 |

하나라도 빠지면 `/_next/static/*` 로드가 실패하고, React 하이드레이션이 일어나지 않아 브리지가 **시작조차 못 한다.** 증상은 UI가 `MCP host 연결 대기 중...`에 영원히 머무는 것이라 브리지 버그처럼 보이지만 아니다.

### UI를 고쳐도 반영이 안 될 때

`app/mcp/route.ts`의 `UI_VERSION`을 올렸는지 확인한다. 호스트가 `ui://` 리소스를 URI 기준으로 캐싱하므로, 버전을 올리지 않으면 **배포는 성공했는데 옛 HTML이 계속 쓰인다.**

클라이언트 번들이 바뀌는 변경(에셋 맵 수정 등)도 UI 변경이다. 코드와 같은 커밋에 넣는다.

### 스키마를 고쳤는데 반영이 안 될 때

도구 스키마는 호스트 세션 시작 시점에 스냅샷으로 잡힌다. 기존 대화에서는 절대 반영되지 않는다. **검증은 항상 새 대화에서** 한다. 커넥터 재등록은 필요 없다.

## 감정 추가하기

1. 에셋을 `assets/`에 넣는다.
2. `app/emotions.ts`의 `EMOTION_LABELS`에 키와 라벨 한 줄.
3. `app/emotion-assets.ts`에 import 한 줄, 맵 엔트리 한 줄.
4. `UI_VERSION`을 올린다.

셀 중 하나라도 빠지면 빌드가 실패한다. `Record<Emotion, ...>` 타입이 전수를 강제하므로 런타임 검사가 필요 없다.

변형을 늘리려면 맵 엔트리의 배열에 추가하면 된다. 별도 감정 키로 만들지 않는다.

### 에셋을 올리는 방법

바이너리는 GitHub API로 직접 올리지 않는다. 파일당 base64 46KB 수준의 오버헤드가 생긴다.

Actions 탭의 **Import emotion assets** 워크플로를 실행하면 `amamirugi/claude-chan-emoticon-railway`에서 에셋을 동기화한다. 복사가 GitHub 내부에서 일어난다.

## 개발

```bash
npm install
npm run dev
```

로컬에서는 `http://localhost:3000`을 직접 열어도 대기 문구만 보인다. **정상이다.** `use-mcp-app.ts`가 iframe 밖에서는 브리지를 연결하지 않기 때문이다. 실제 확인은 Claude.ai에 등록해서 한다.

이 리포는 `amamirugi/claude-chan-emoticon-railway`를 대체한다. 에셋을 제외한 구 구현은 사용하지 않는다.
