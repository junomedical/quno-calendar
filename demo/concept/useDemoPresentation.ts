import { useEffect, useLayoutEffect, useRef, useState } from "react";
export function useDemoPresentation(stop: () => void) {
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 850px)").matches);
  const [fullscreen, setFullscreen] = useState(false);
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const wasFullscreen = useRef(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 850px)");
    const change = () => {
      setMobile(query.matches);
      stop();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        stop();
        setFullscreen(false);
      }
    };
    query.addEventListener("change", change);
    window.addEventListener("keydown", escape);
    return () => {
      query.removeEventListener("change", change);
      window.removeEventListener("keydown", escape);
    };
  }, [stop]);
  useLayoutEffect(() => {
    if (fullscreen) closeButton.current?.focus({ preventScroll: true });
    else if (wasFullscreen.current) openButton.current?.focus({ preventScroll: true });
    wasFullscreen.current = fullscreen;
  }, [fullscreen]);
  return {
    mobile,
    fullscreen,
    openButton,
    closeButton,
    setFullscreen,
    open: () => {
      stop();
      setFullscreen(true);
    },
    close: () => {
      stop();
      setFullscreen(false);
    }
  };
}
