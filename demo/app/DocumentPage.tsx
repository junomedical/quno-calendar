import "./documentPage.css";
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
    <Suspense fallback={<div className="document-placeholder" aria-busy="true" aria-label="Loading documentation" />}>
      <DocumentContent>
        <Page />
      </DocumentContent>
    </Suspense>
  );
}
