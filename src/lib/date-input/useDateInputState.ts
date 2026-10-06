import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { singleDay, type DateRange } from "#quno-internal/shared/dateRangeModel";
import { clockTimeIsEnabled } from "#quno-internal/shared/clockTime";
import { createDateInputAnalyzer } from "#quno-internal/date-parser/dateInputParser";
import { equalDateRanges, recognitionOf } from "./dateInputViewHelpers";
import { useDateInputFormat } from "./useDateInputFormat";
import type { DateInputSpinMemory } from "./dateInputKeyboard";
import type { QunoDateInputProps } from "./dateInputTypes";

export function useDateInputState(props: QunoDateInputProps) {
  const {
    value,
    defaultValue = null,
    selectionMode = "range",
    time,
    defaultTime = null,
    expectedRange,
    referenceDate,
    weekStartsOn = 1,
    locale = "en-GB",
    preferredDateOrder,
    parserLanguages,
    lexicon,
    formatters,
    enabledHours,
    minuteCadence,
    forceCadence = false,
    onChange
  } = props;
  const timeMode = Boolean(props.timeMode && selectionMode === "single");
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const range = controlled ? value : internalValue;
  const start = range?.start,
    end = range?.end;
  const selection = useMemo(
    () => (start ? (selectionMode === "single" ? singleDay({ date: start }) : { start, end: end! }) : null),
    [start, end, selectionMode]
  );
  const [internalTime, setInternalTime] = useState(defaultTime);
  const selectedTime = time !== undefined ? time : internalTime;
  const dateFormat = useDateInputFormat({ formatters, locale });
  const format = ({ value, time: clock }: { value: DateRange; time?: string | null }) =>
    `${dateFormat({ value })}${timeMode && clock ? ` ${formatters?.time?.({ time: clock, locale }) ?? clock}` : ""}`;
  const [draft, setDraft] = useState(selection ? format({ value: selection, time: selectedTime }) : "");
  const [invalid, setInvalid] = useState(false);
  const [recognition, setRecognition] = useState<"recognized" | "unrecognized" | undefined>(
    selection ? "recognized" : undefined
  );
  const composing = useRef(false);
  const committed = useRef<DateRange | null>(selection);
  const committedTime = useRef(selectedTime);
  const spinMemory = useRef<DateInputSpinMemory | undefined>(undefined);
  const lastTimeMode = useRef(timeMode);
  useEffect(() => {
    const modeChanged = lastTimeMode.current !== timeMode;
    lastTimeMode.current = timeMode;
    if (controlled || time !== undefined || modeChanged) {
      committed.current = selection;
      committedTime.current = selectedTime;
      spinMemory.current = undefined;
      const date = selection ? dateFormat({ value: selection }) : "";
      const clock =
        timeMode && selection && selectedTime
          ? ` ${formatters?.time?.({ time: selectedTime, locale }) ?? selectedTime}`
          : "";
      setDraft(`${date}${clock}`);
      setInvalid(false);
      setRecognition(selection ? "recognized" : undefined);
    }
  }, [controlled, dateFormat, formatters, locale, selectedTime, selection, time, timeMode]);
  const parserOptions = useMemo(
    () => ({
      expectedRange,
      selectionMode,
      referenceDate,
      weekStartsOn,
      locale,
      preferredDateOrder,
      parserLanguages,
      lexicon,
      recognizeTime: timeMode
    }),
    [
      expectedRange,
      selectionMode,
      referenceDate,
      weekStartsOn,
      locale,
      preferredDateOrder,
      parserLanguages,
      lexicon,
      timeMode
    ]
  );
  const analyzer = useMemo(() => createDateInputAnalyzer(parserOptions), [parserOptions]);
  const parse = ({ text }: { text: string }) => {
    const result = analyzer.analyze({ text }).result;
    if (timeMode && (result.status === "success" || result.status === "partial-range")) {
      const clock = result.start.time;
      if (
        (forceCadence && clock && !clockTimeIsEnabled({ time: clock, enabledHours, minuteCadence })) ||
        result.end.time !== result.start.time
      )
        return { status: "invalid" } as const;
    }
    return result;
  };
  const commit = () => {
    if (composing.current) return;
    const result = parse({ text: draft });
    setRecognition(recognitionOf(result));
    if (result.status !== "empty" && result.status !== "success") {
      setInvalid(true);
      return;
    }
    const value = result.status === "empty" ? null : { start: result.start.date, end: result.end.date };
    const clock = result.status === "empty" ? null : result.start.time;
    setInvalid(false);
    setDraft(value ? format({ value, time: clock }) : "");
    if (!controlled) setInternalValue(value);
    if (time === undefined) setInternalTime(clock);
    if (!equalDateRanges({ left: committed.current, right: value }) || (timeMode && committedTime.current !== clock)) {
      committed.current = value;
      committedTime.current = clock;
      onChange?.({ value, ...(timeMode ? { time: clock } : {}) });
    }
  };
  const input = ({ text, element }: { text: string; element: HTMLInputElement }) => {
    spinMemory.current = undefined;
    setDraft(text);
    setInvalid(false);
    if (composing.current) return;
    const result = parse({ text });
    startTransition(() => setRecognition(recognitionOf(result)));
    if (result.status === "partial-range" && text.length >= draft.length) {
      const formatted = `${format({ value: { start: result.start.date, end: result.end.date } })} – `;
      element.value = formatted;
      element.setSelectionRange(formatted.length, formatted.length);
      setDraft(formatted);
    }
  };
  return {
    draft,
    setDraft,
    invalid,
    setInvalid,
    recognition,
    setRecognition,
    composing,
    spinMemory,
    commit,
    input,
    parse,
    analyzer,
    parserOptions,
    dateFormat,
    format,
    timeMode
  };
}

export type DateInputState = ReturnType<typeof useDateInputState>;
