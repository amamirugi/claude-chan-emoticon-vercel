declare global {
  interface Window {
    __baseUrl: string;
  }
}

/**
 * Next.js 페이지가 MCP 호스트의 sandboxed iframe 안에서 동작하게 만드는 인라인 스크립트들.
 * 이게 없으면 /_next/static/* 이 opaque origin 기준으로 해석되어 로드에 실패하고,
 * React 하이드레이션이 일어나지 않아 MCP App 브리지가 시작조차 하지 못한다.
 */
export function IframeBootstrap({ baseUrl }: { baseUrl: string }) {
  return (
    <>
      {/* 상대 URL(/_next/static, /mcp 등)을 실제 서버로 해석시킨다 */}
      <base href={baseUrl} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__baseUrl=${JSON.stringify(baseUrl)};`,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(${iframePatchFn.toString()})()`,
        }}
      />
    </>
  );
}

/**
 * 인라인 <script>로 주입되어 React 하이드레이션 이전에 실행되는 자기실행 함수.
 * `.toString()`으로 직렬화되어 다른 컨텍스트에서 실행되므로, 여기의 타입은 가독성용이며
 * 직렬화 시점에 제거된다.
 */
function iframePatchFn() {
  const baseUrl: string = window.__baseUrl;
  const htmlElement = document.documentElement;
  const isInIframe = window.self !== window.top;

  // 1. 호스트가 <html> 속성을 건드려 하이드레이션 오류를 내는 것을 막는다.
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.target === htmlElement) {
        const attr = mutation.attributeName;
        if (attr && attr !== "suppresshydrationwarning" && attr !== "lang") {
          htmlElement.removeAttribute(attr);
        }
      }
    }
  });
  observer.observe(htmlElement, { attributes: true, attributeOldValue: true });

  // 2. history 패치 - sandbox가 cross-origin state 변경을 거부할 수 있다.
  const origReplace = history.replaceState.bind(history);
  history.replaceState = function (
    _state: unknown,
    unused: string,
    url?: string | URL | null,
  ) {
    try {
      const u = new URL(String(url ?? ""), window.location.href);
      origReplace(null, unused, u.pathname + u.search + u.hash);
    } catch {
      /* sandboxed iframe의 SecurityError */
    }
  };

  const origPush = history.pushState.bind(history);
  history.pushState = function (
    _state: unknown,
    unused: string,
    url?: string | URL | null,
  ) {
    try {
      const u = new URL(String(url ?? ""), window.location.href);
      origPush(null, unused, u.pathname + u.search + u.hash);
    } catch {
      /* sandboxed iframe의 SecurityError */
    }
  };

  // 3. 외부 링크 클릭을 호스트의 openExternal로 넘긴다.
  const appOrigin = new URL(baseUrl).origin;
  window.addEventListener(
    "click",
    (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.("a");
      if (!a?.href) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin && url.origin !== appOrigin) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).openai?.openExternal?.({ href: a.href });
          e.preventDefault();
        } catch {
          /* noop */
        }
      }
    },
    true,
  );

  // 4. fetch 패치 - RSC / 데이터 페이로드가 실제 서버로 가도록 한다.
  if (isInIframe && window.location.origin !== appOrigin) {
    const originalFetch = window.fetch.bind(window);

    window.fetch = function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      let url: URL;
      if (typeof input === "string" || input instanceof URL) {
        url = new URL(String(input), window.location.href);
      } else {
        url = new URL(input.url, window.location.href);
      }

      if (url.origin === appOrigin || url.origin === window.location.origin) {
        const rewritten = new URL(baseUrl);
        rewritten.pathname = url.pathname;
        rewritten.search = url.search;
        rewritten.hash = url.hash;

        const newInput =
          typeof input === "string" || input instanceof URL
            ? rewritten.toString()
            : new Request(rewritten.toString(), input);

        return originalFetch(newInput, { ...init, mode: "cors" });
      }

      return originalFetch(input, init);
    } as typeof fetch;
  }
}
