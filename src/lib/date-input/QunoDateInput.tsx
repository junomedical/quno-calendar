import { DEFAULT_DATE_INPUT_FORMATTER } from "./dateInputFormat";
import { spinDateInput, type DateInputSpinMemory } from "./dateInputKeyboard";
import { parseDateInput } from "./dateInputParser";
import { equalDateRanges, inputClass, recognitionOf } from "./dateInputViewHelpers";
import { singleDay, type DateRange } from "#quno-internal/shared/dateRangeModel";
import type { QunoDateInputProps } from "./dateInputTypes";
import type { FormEventHandler, JSX } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const QunoDateInput = ({
  value,
  defaultValue = null,
  expectedRange,
  selectionMode = "range",
  referenceDate,
  weekStartsOn = 1,
  locale = "en-GB",
  preferredDateOrder,
  parserLanguage,
  parserLanguages,
  labels,
  formatter,
  lexicon,
  className,
  classNames,
  placeholder,
  onChange,
  onBlur,
  onInput,
  onKeyDown,
  onPointerDown,
  onCompositionStart,
  onCompositionEnd,
  ...inputProps
}: QunoDateInputProps): JSX.Element => {
  const controlled = value !== undefined;
  const range = controlled ? (value ?? null) : defaultValue;
  const rangeStart = range?.start,
    rangeEnd = range?.end;
  const selection = useMemo(
    () =>
      rangeStart ? (selectionMode === "single" ? singleDay(rangeStart) : { start: rangeStart, end: rangeEnd! }) : null,
    [rangeEnd, rangeStart, selectionMode]
  );
  const format = useCallback(
    (range: DateRange, preserveRange = false): string => {
      const value = (formatter?.range ?? DEFAULT_DATE_INPUT_FORMATTER)(range, locale);
      return preserveRange && range.start === range.end ? `${value} – ${value}` : value;
    },
    [formatter, locale]
  );
  const [draft, setDraft] = useState(selection ? format(selection) : "");
  const [invalid, setInvalid] = useState(false);
  const [recognition, setRecognition] = useState<"recognized" | "unrecognized" | undefined>(
    selection ? "recognized" : undefined
  );
  const composing = useRef(false);
  const committed = useRef<DateRange | null>(selection);
  const spinMemory = useRef<DateInputSpinMemory | undefined>();

  useEffect(() => {
    if (controlled) {
      committed.current = selection;
      spinMemory.current = undefined;
      setDraft(selection ? format(selection) : "");
      setInvalid(false);
      setRecognition(selection ? "recognized" : undefined);
    }
  }, [controlled, format, selection]);

  const parse = (text: string) =>
    parseDateInput(text, {
      expectedRange,
      selectionMode,
      referenceDate,
      weekStartsOn,
      locale,
      preferredDateOrder,
      parserLanguage,
      parserLanguages,
      lexicon
    });

  const commit = (): void => {
    if (composing.current) return;
    const result = parse(draft);
    setRecognition(recognitionOf(result));
    if (result.status === "empty") {
      setInvalid(false);
      if (!equalDateRanges(committed.current, null)) {
        committed.current = null;
        if (!controlled) setDraft("");
        onChange?.(null);
      }
      return;
    }
    if (result.status !== "success") {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setDraft(format(result.value));
    if (!equalDateRanges(committed.current, result.value)) {
      committed.current = result.value;
      onChange?.(result.value);
    }
  };

  const handleInput: FormEventHandler<HTMLInputElement> = (event) => {
    const next = event.currentTarget.value;
    spinMemory.current = undefined;
    setDraft(next);
    setInvalid(false);
    if (!composing.current) {
      const result = parse(next);
      setRecognition(recognitionOf(result));
      if (result.status === "partial-range" && next.length >= draft.length) {
        const formatted = `${format(result.value)} – `;
        event.currentTarget.value = formatted;
        event.currentTarget.setSelectionRange(formatted.length, formatted.length);
        setDraft(formatted);
      }
    }
    onInput?.(event);
  };

  return (
    <span className={inputClass("quno-date-picker-input-root", classNames?.root)} data-slot="root">
      <input
        {...inputProps}
        value={draft}
        className={inputClass("quno-date-picker-input", className, classNames?.input)}
        data-slot="input"
        data-recognition={recognition}
        aria-invalid={invalid || undefined}
        placeholder={placeholder ?? labels?.placeholder}
        onInput={handleInput}
        onPointerDown={(event) => {
          spinMemory.current = undefined;
          onPointerDown?.(event);
        }}
        onBlur={(event) => {
          commit();
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if ((event.key === "ArrowUp" || event.key === "ArrowDown") && !event.defaultPrevented && !composing.current) {
            const spun = spinDateInput(
              draft,
              event.currentTarget.selectionStart ?? draft.length,
              event.key === "ArrowUp" ? 1 : -1,
              {
                expectedRange,
                selectionMode,
                referenceDate,
                weekStartsOn,
                locale,
                preferredDateOrder,
                parserLanguage,
                parserLanguages,
                lexicon
              },
              format,
              spinMemory.current
            );
            if (spun) {
              event.preventDefault();
              event.currentTarget.value = spun.text;
              event.currentTarget.setSelectionRange(spun.caret, spun.caret);
              setDraft(spun.text);
              setInvalid(false);
              setRecognition("recognized");
              spinMemory.current = { key: spun.key, offset: spun.offset };
            }
          }
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") spinMemory.current = undefined;
          if (event.key === "Enter" && !event.defaultPrevented) commit();
        }}
        onCompositionStart={(event) => {
          composing.current = true;
          setRecognition(undefined);
          onCompositionStart?.(event);
        }}
        onCompositionEnd={(event) => {
          composing.current = false;
          const next = event.currentTarget.value;
          setDraft(next);
          setRecognition(recognitionOf(parse(next)));
          onCompositionEnd?.(event);
        }}
      />
    </span>
  );
};
