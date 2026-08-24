import { DEFAULT_DATE_INPUT_FORMATTER } from "./dateInputFormat";
import { spinDateInput, type DateInputSpinMemory } from "./dateInputKeyboard";
import { parseDateInput } from "./dateInputParser";
import { singleDay, type DateRange } from "#quno-internal/shared/dateRangeModel";
import type { QunoDateInputProps } from "./dateInputTypes";
import type { FormEventHandler, JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const equal = (left: DateRange | null, right: DateRange | null): boolean =>
  left === right || Boolean(left && right && left.start === right.start && left.end === right.end);

const inputClass = (...classes: Array<string | undefined>): string => classes.filter(Boolean).join(" ");

const recognitionOf = (result: ReturnType<typeof parseDateInput>) => {
  if (result.status === "empty") return undefined;
  return result.status === "success" || result.status === "partial-range" ? "recognized" : "unrecognized";
};

export const QunoDateInput = ({
  value,
  defaultValue = null,
  expectedRange,
  selectionMode = "range",
  referenceDate,
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
  const selection = range && selectionMode === "single" ? singleDay(range.start) : range;
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
      if (!equal(committed.current, null)) {
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
    if (!equal(committed.current, result.value)) {
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

export type {
  QunoDateInputClassNames,
  QunoDateInputFormatter,
  QunoDateInputLabels,
  QunoDateInputProps,
  QunoDateInputSlot
} from "./dateInputTypes";
