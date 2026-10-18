import type { RequestClock } from "#quno-internal/timeline/runtime/data/Acquisition";

export const requestClock: RequestClock = {
  delay: ({ milliseconds, signal }) =>
    new Promise((resolve) => {
      if (signal.aborted) {
        resolve(false);
        return;
      }
      const finish = () => {
        signal.removeEventListener("abort", cancel);
        resolve(true);
      };
      const timer = setTimeout(finish, milliseconds);
      const cancel = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", cancel);
        resolve(false);
      };
      signal.addEventListener("abort", cancel, { once: true });
    })
};
