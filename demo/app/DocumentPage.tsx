import { Suspense, useLayoutEffect, type ComponentType, type ReactNode } from "react";
function DocumentContent({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    try {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id) document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" });
    } catch {
      /* A malformed URL fragment has no matching section. */
    }
  }, []);
  return children;
}
export function DocumentPage({ page: Page }: { page: ComponentType }) {
  return (
    <Suspense fallback={<p>Opening documentation…</p>}>
      <DocumentContent>
        <Page />
      </DocumentContent>
    </Suspense>
  );
}
