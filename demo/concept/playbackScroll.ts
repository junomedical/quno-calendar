import { animate, ease, type Easing } from "./playbackMotion";
export async function scrollBy(
  signal: AbortSignal,
  target: HTMLElement,
  x: number,
  y: number,
  durationMs: number,
  easing: Easing = "ease-in-out"
) {
  let previousX = 0;
  let previousY = 0;
  await animate(signal, durationMs, (progress) => {
    const currentX = Math.round(x * ease(progress, easing));
    const currentY = Math.round(y * ease(progress, easing));
    target.scrollLeft += currentX - previousX;
    target.scrollTop += currentY - previousY;
    previousX = currentX;
    previousY = currentY;
  });
}
const nearest = (start: number, end: number, min: number, max: number) => {
  if ((start >= min && end <= max) || (start < min && end > max)) return 0;
  return start < min ? start - min : end - max;
};
export async function reveal(signal: AbortSignal, target: HTMLElement) {
  const page = document.scrollingElement as HTMLElement;
  for (let parent = target.parentElement; parent; parent = parent.parentElement) {
    const isPage = parent === page;
    const style = getComputedStyle(parent);
    const box = parent.getBoundingClientRect();
    const item = target.getBoundingClientRect();
    const left = isPage ? 0 : box.left + parent.clientLeft;
    const top = isPage ? 0 : box.top + parent.clientTop;
    const width = isPage ? window.innerWidth : parent.clientWidth;
    const height = isPage ? window.innerHeight : parent.clientHeight;
    const x = isPage || /auto|scroll/.test(style.overflowX) ? nearest(item.left, item.right, left, left + width) : 0;
    const y = isPage || /auto|scroll/.test(style.overflowY) ? nearest(item.top, item.bottom, top, top + height) : 0;
    if (x || y) await scrollBy(signal, parent, x, y, 360);
  }
}
