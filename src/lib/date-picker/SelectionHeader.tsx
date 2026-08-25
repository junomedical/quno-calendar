import { classNames as cx } from "./classNames";
import type { ResolvedDatePickerConfig } from "./datePickerTypes";
import type { DateRange } from "#quno-internal/shared/dateRangeModel";
import type { JSX } from "react";

type Props = {
  selection: DateRange | null;
  config: ResolvedDatePickerConfig;
  onClear: () => void;
};

export const SelectionHeader = ({ selection, config, onClear }: Props): JSX.Element => {
  const { labels, formatters, locale, classNames } = config;
  const summary = selection
    ? selection.start === selection.end
      ? formatters.date(selection.start, locale)
      : `${formatters.date(selection.start, locale)} – ${formatters.date(selection.end, locale)}`
    : labels.chooseDate;

  return (
    <header
      className={cx("quno-date-picker-selection-header", classNames?.selectionHeader)}
      data-slot="selection-header"
    >
      <div>
        <span className={cx("quno-date-picker-eyebrow", classNames?.selectionEyebrow)} data-slot="selection-eyebrow">
          {labels.selectedPeriod}
        </span>
        <strong className={classNames?.selectionSummary} data-slot="selection-summary">
          {summary}
        </strong>
      </div>
      <button
        type="button"
        className={cx("quno-date-picker-clear", classNames?.clearButton)}
        data-slot="clear-button"
        disabled={!selection}
        onClick={onClear}
      >
        {labels.clear}
      </button>
    </header>
  );
};
