import { classNames as inputClass } from "#quno-internal/shared/classNames";
import { useDateInputFormat } from "./useDateInputFormat";
import { spinDateInput, type DateInputSpinMemory } from "./dateInputKeyboard";
import { createDateInputAnalyzer } from "#quno-internal/date-parser/dateInputParser";
import { equalDateRanges, recognitionOf } from "./dateInputViewHelpers";
import { singleDay, type DateRange } from "#quno-internal/shared/dateRangeModel";
import type { QunoDateInputProps } from "./dateInputTypes";
import type { FormEventHandler, JSX } from "react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

export const QunoDateInput = ({
  value,
  defaultValue = null,
  expectedRange,
  selectionMode = "range",
  referenceDate,
  weekStartsOn = 1,
  locale = "en-GB",
  preferredDateOrder,

  parserLanguages,
  labels,
  formatters,
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
      rangeStart
        ? selectionMode === "single"
          ? singleDay({ date: rangeStart })
          : { start: rangeStart, end: rangeEnd! }
        : null,
    [rangeEnd, rangeStart, selectionMode]
  );
  const format = useDateInputFormat({ formatters, locale });
  const [draft, setDraft] = useState(selection ? format({ value: selection }) : "");
  const [invalid, setInvalid] = useState(false);
  const [recognition, setRecognition] = useState<"recognized" | "unrecognized" | undefined>(
    selection ? "recognized" : undefined
  );
  const composing = useRef(false);
  const committed = useRef<DateRange | null>(selection);
  const spinMemory = useRef<DateInputSpinMemory | undefined>(undefined);

  useEffect(() => {
    if (controlled) {
      committed.current = selection;
      spinMemory.current = undefined;
      setDraft(selection ? format({ value: selection }) : "");
      setInvalid(false);
      setRecognition(selection ? "recognized" : undefined);
    }
  }, [controlled, format, selection]);

  const parserOptions = useMemo(
    () => ({
      expectedRange,
      selectionMode,
      referenceDate,
      weekStartsOn,
      locale,
      preferredDateOrder,
      parserLanguages,
      lexicon
    }),
    [expectedRange, lexicon, locale, parserLanguages, preferredDateOrder, referenceDate, selectionMode, weekStartsOn]
  );
  const analyzer = useMemo(() => createDateInputAnalyzer(parserOptions), [parserOptions]);
  const parse = ({ text }: { text: string }) => analyzer.analyze({ text }).result;

  const commit = (): void => {
    if (composing.current) return;
    const result = parse({ text: draft });
    setRecognition(recognitionOf(result));
    if (result.status === "empty") {
      setInvalid(false);
      if (!equalDateRanges({ left: committed.current, right: null })) {
        committed.current = null;
        if (!controlled) setDraft("");
        onChange?.({ value: null });
      }
      return;
    }
    if (result.status !== "success") {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setDraft(format({ value: result.value }));
    if (!equalDateRanges({ left: committed.current, right: result.value })) {
      committed.current = result.value;
      onChange?.({ value: result.value });
    }
  };

  const handleInput: FormEventHandler<HTMLInputElement> = (event) => {
    const next = event.currentTarget.value;
    spinMemory.current = undefined;
    setDraft(next);
    setInvalid(false);
    if (!composing.current) {
      const result = parse({ text: next });
      startTransition(() => setRecognition(recognitionOf(result)));
      if (result.status === "partial-range" && next.length >= draft.length) {
        const formatted = `${format({ value: result.value })} – `;
        event.currentTarget.value = formatted;
        event.currentTarget.setSelectionRange(formatted.length, formatted.length);
        setDraft(formatted);
      }
    }
    onInput?.(event);
  };

  return (
    <span className={inputClass({ values: ["quno-date-picker-input-root", classNames?.root] })} data-slot="root">
      <input
        {...inputProps}
        value={draft}
        className={inputClass({ values: ["quno-date-picker-input", className, classNames?.input] })}
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
            const spun = spinDateInput({
              text: draft,
              cursor: event.currentTarget.selectionStart ?? draft.length,
              direction: event.key === "ArrowUp" ? 1 : -1,
              options: {
                expectedRange,
                selectionMode,
                referenceDate,
                weekStartsOn,
                locale,
                preferredDateOrder,

                parserLanguages,
                lexicon
              },
              analyzer,
              format,
              memory: spinMemory.current
            });
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
          setRecognition(recognitionOf(parse({ text: next })));
          onCompositionEnd?.(event);
        }}
      />
    </span>
  );
};
