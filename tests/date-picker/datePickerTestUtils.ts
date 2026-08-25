import { fireEvent } from "@testing-library/react";

export const day = (date: string): HTMLButtonElement => {
  const element = document.querySelector<HTMLButtonElement>(`[data-date="${date}"]`);
  if (!element) {
    throw new Error(`Day ${date} is not rendered`);
  }
  return element;
};

export const clickDay = (date: string): void => {
  const element = day(date);
  fireEvent.pointerDown(element);
  fireEvent.pointerUp(element);
};

export const drag = (from: string, to: string): void => {
  fireEvent.pointerDown(day(from));
  fireEvent.pointerEnter(day(to));
  fireEvent.pointerUp(day(to));
};

export const slot = <T extends Element>(name: string): T => {
  const element = document.querySelector<T>(`[data-slot="${name}"]`);
  if (!element) {
    throw new Error(`Slot ${name} is not rendered`);
  }
  return element;
};

export const edge = (direction: "previous" | "next"): HTMLDivElement => {
  const element = document.querySelector<HTMLDivElement>(`[data-slot="edge"][data-direction="${direction}"]`);
  if (!element) {
    throw new Error(`Edge ${direction} is not rendered`);
  }
  return element;
};

export const overflowDay = (date: string): HTMLSpanElement => {
  const element = document.querySelector<HTMLSpanElement>(`[data-slot="overflow-day"][data-date="${date}"]`);
  if (!element) {
    throw new Error(`Overflow day ${date} is not rendered`);
  }
  return element;
};

export const weekday = (dayIndex: number): HTMLSpanElement => {
  const element = document.querySelector<HTMLSpanElement>(`[data-slot="weekday"][data-day-index="${dayIndex}"]`);
  if (!element) {
    throw new Error(`Weekday ${dayIndex} is not rendered`);
  }
  return element;
};

export const pill = (endpoint: "start" | "end", position: "before" | "after"): HTMLButtonElement => {
  const element = document.querySelector<HTMLButtonElement>(
    `[data-slot="pill"][data-endpoint="${endpoint}"][data-position="${position}"]`
  );
  if (!element) {
    throw new Error(`Pill ${endpoint}/${position} is not rendered`);
  }
  return element;
};
