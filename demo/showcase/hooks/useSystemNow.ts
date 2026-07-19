import { useEffect, useState } from "react";

export function useSystemNow() {
  const [systemNow, setSystemNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setSystemNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return systemNow;
}
