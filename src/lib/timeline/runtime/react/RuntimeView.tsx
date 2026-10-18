import { forwardRef } from "react";
import type { CalendarInternalViewProps, CalendarViewHandle } from "#quno-internal/timeline/core/internalTypes";
import type { Orientation } from "#quno-internal/timeline/runtime/model/types";
import { useRuntimeView } from "./useRuntimeView";
import { RuntimeCanvas } from "./RuntimeCanvas";

export const RuntimeView = forwardRef<CalendarViewHandle, CalendarInternalViewProps & { orientation: Orientation }>(
  function RuntimeView({ orientation, ...props }, forwardedRef) {
    const runtime = useRuntimeView({ props, orientation, forwardedRef });
    return <RuntimeCanvas props={props} runtime={runtime} />;
  }
);
