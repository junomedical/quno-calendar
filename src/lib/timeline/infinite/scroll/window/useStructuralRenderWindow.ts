import { useLayoutEffect, useRef, useState } from "react";
import { clampVirtualDateIndex } from "./dateModel";

type StructuralRenderWindowArgs = {
  transitionKey: string;
  resourceTransitionKey: string;
  topVisibleDateKey: string;
  itemCount: number;
  dateKeyToIndex: (args: { dateKey: string }) => number;
};

/** Pins semantic base geometry until a changed date/layout model has settled. */
export function useStructuralRenderWindow({
  transitionKey,
  resourceTransitionKey,
  topVisibleDateKey,
  itemCount,
  dateKeyToIndex
}: StructuralRenderWindowArgs) {
  const previousTransitionKeyRef = useRef(transitionKey);
  const previousResourceTransitionKeyRef = useRef(resourceTransitionKey);
  const overrideRef = useRef<{
    transitionKey: string;
    anchorIndex: number;
    anchorDateKey: string;
    retainAllResources: boolean;
  } | null>(null);
  const [, setTransitionVersion] = useState(0);

  if (previousTransitionKeyRef.current !== transitionKey) {
    overrideRef.current = {
      transitionKey,
      anchorIndex: clampVirtualDateIndex({ index: dateKeyToIndex({ dateKey: topVisibleDateKey }), count: itemCount }),
      anchorDateKey: topVisibleDateKey,
      retainAllResources: previousResourceTransitionKeyRef.current !== resourceTransitionKey
    };
  }
  const anchorIndex =
    overrideRef.current?.transitionKey === transitionKey ? overrideRef.current.anchorIndex : undefined;
  const anchorDateKey =
    overrideRef.current?.transitionKey === transitionKey ? overrideRef.current.anchorDateKey : undefined;
  const retainAllResources = Boolean(anchorIndex !== undefined && overrideRef.current?.retainAllResources);

  useLayoutEffect(() => {
    previousTransitionKeyRef.current = transitionKey;
    previousResourceTransitionKeyRef.current = resourceTransitionKey;
    if (anchorIndex === undefined) return;

    let releaseFrame = 0;
    const settleFrame = requestAnimationFrame(() => {
      releaseFrame = requestAnimationFrame(() => {
        if (overrideRef.current?.transitionKey !== transitionKey) return;
        overrideRef.current = null;
        setTransitionVersion((version) => version + 1);
      });
    });
    return () => {
      cancelAnimationFrame(settleFrame);
      cancelAnimationFrame(releaseFrame);
    };
  }, [anchorIndex, resourceTransitionKey, transitionKey]);

  return { anchorDateKey, anchorIndex, retainAllResources };
}
