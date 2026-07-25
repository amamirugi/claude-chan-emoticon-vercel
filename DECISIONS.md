# DECISIONS — Claude-chan Emoticon Vercel

## 확정된 결정

- 이 리포는 기존 Railway 리포와 분리된 Vercel 전용 정본이다.
- 기본 브랜치 `main`을 Vercel Production Branch로 사용한다.
- MCP endpoint는 `/mcp`다.
- 현재 P1은 `express_emotion({ emotion: "happy" })`만 지원한다.
- 결과 이미지는 raw MCP `type: image`가 아니라 MCP App iframe 내부에서 렌더링한다.
- `happy.webp`는 이 리포에 자체 포함한다.

## 기각된 대안

- 기존 리포의 `vercel-revival` 브랜치를 매번 Preview 배포 후 Production으로 Promote하는 흐름.
- 인증 없는 P1 서버에 OAuth를 추가하는 방식.
- raw image tool result fallback.

## 현재 상태

- 독립 GitHub 리포의 `main`에 Vercel/Next.js P1 코드와 `happy.webp`를 이전했다.
- 이전 배포에서는 도구 호출과 iframe 생성은 성공했지만 UI가 `MCP host 연결 대기 중...`에 머물러 bridge 연결 실패가 확인됐다.
- 공식 Vercel MCP Apps starter와 동일한 패키지 조합 및 hook 구조를 반영한 수정본이 현재 기준이다.

## 다음 단계

1. 이 리포를 Vercel에 Import하고 `main` Production 자동 배포를 확인한다.
2. Claude.ai Custom Connector를 새 Production `/mcp` URL로 등록한다.
3. 새 채팅에서 `express_emotion({ emotion: "happy" })` 호출 후 실제 이미지 렌더링을 검증한다.
4. 성공 후 나머지 감정 자산을 복원한다.
