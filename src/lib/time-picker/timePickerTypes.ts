import type { HTMLAttributes } from "react";
import type { MinuteCadence } from "#quno-internal/shared/clockTime";

export type QunoTimePickerSlot =
  | "root"
  | "selectionSummary"
  | "clearButton"
  | "timeNavigation"
  | "hourGroup"
  | "hourHeading"
  | "minuteOption";
export type QunoTimePickerClassNames = Partial<Record<QunoTimePickerSlot, string>>;
export type QunoTimePickerLabels = {
  timeNavigation: string;
  noEnabledHours: string;
  empty: string;
  clear: string;
};
export type QunoTimePickerFormatters = {
  time: (args: { time: string; locale: string }) => string;
};

export type QunoTimePickerProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "children"> & {
  /** Separate timezone-free HH:mm clock. Null clears the selection. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (args: { value: string | null }) => void;
  /** Zero-based hours; omitted or empty enables all 24. */
  enabledHours?: readonly number[];
  minuteCadence?: MinuteCadence;
  disabled?: boolean;
  locale?: string;
  labels?: Partial<QunoTimePickerLabels>;
  formatters?: Partial<QunoTimePickerFormatters>;
  classNames?: QunoTimePickerClassNames;
};
