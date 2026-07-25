# Claude-chan Emoticon Vercel

Vercel 전용 Claude.ai MCP App 이모티콘 서버.

- 기본 브랜치: `main`
- MCP endpoint: `/mcp`
- 현재 P1 지원 감정: `happy`
- `main` 커밋이 Vercel Production으로 자동 배포되는 단일 리포 구조

## Local

```bash
npm install
npm run dev
```

## Vercel

이 리포를 Vercel에 Import하고 Framework Preset을 Next.js로 설정한다. Claude.ai Custom Connector URL은 Production 도메인의 `/mcp`를 사용한다.
