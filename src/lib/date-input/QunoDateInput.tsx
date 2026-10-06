import { classNames as inputClass } from "#quno-internal/shared/classNames";
import { spinDateInput } from "./dateInputKeyboard";
import { spinClockInput } from "./dateInputTimeKeyboard";
import { recognitionOf } from "./dateInputViewHelpers";
import { useDateInputState } from "./useDateInputState";
import type { QunoDateInputProps } from "./dateInputTypes";
import type { JSX } from "react";

export const QunoDateInput = (props: QunoDateInputProps): JSX.Element => {
  const state = useDateInputState(props);
  const {
    value: _value,
    defaultValue: _defaultValue,
    expectedRange: _expectedRange,
    selectionMode: _selectionMode,
    referenceDate: _referenceDate,
    weekStartsOn: _weekStartsOn,
    locale: _locale,
    preferredDateOrder: _preferredDateOrder,
    parserLanguages: _parserLanguages,
    labels,
    formatters: _formatters,
    lexicon: _lexicon,
    className,
    classNames,
    placeholder,
    timeMode: _timeMode,
    time: _time,
    defaultTime: _defaultTime,
    enabledHours: _enabledHours,
    minuteCadence: _minuteCadence,
    forceCadence: _forceCadence,
    onChange: _onChange,
    onBlur,
    onInput,
    onKeyDown,
    onPointerDown,
    onCompositionStart,
    onCompositionEnd,
    ...inputProps
  } = props;
  return (
    <span className={inputClass({ values: ["quno-date-picker-input-root", classNames?.root] })} data-slot="root">
      <input
        {...inputProps}
        value={state.draft}
        className={inputClass({ values: ["quno-date-picker-input", className, classNames?.input] })}
        data-slot="input"
        data-recognition={state.recognition}
        aria-invalid={state.invalid || undefined}
        placeholder={placeholder ?? labels?.placeholder}
        onInput={(event) => {
          state.input({ text: event.currentTarget.value, element: event.currentTarget });
          onInput?.(event);
        }}
        onPointerDown={(event) => {
          state.spinMemory.current = undefined;
          onPointerDown?.(event);
        }}
        onBlur={(event) => {
          state.commit();
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            (event.key === "ArrowUp" || event.key === "ArrowDown") &&
            !event.defaultPrevented &&
            !state.composing.current
          ) {
            const cursor = event.currentTarget.selectionStart ?? state.draft.length;
            const direction = event.key === "ArrowUp" ? 1 : -1;
            const result = state.parse({ text: state.draft });
            const clock = result.status === "success" ? result.start.time : undefined;
            const spun =
              (state.timeMode &&
                spinClockInput({
                  text: state.draft,
                  cursor,
                  direction,
                  enabledHours: props.forceCadence ? props.enabledHours : undefined,
                  minuteCadence: props.forceCadence ? props.minuteCadence : 1,
                  tokens: state.analyzer.analyze({ text: state.draft }).tokens
                })) ||
              (result.status === "success"
                ? spinDateInput({
                    text: state.draft,
                    cursor,
                    direction,
                    options: state.parserOptions,
                    analyzer: state.analyzer,
                    format: state.timeMode ? ({ value }) => state.format({ value, time: clock }) : state.dateFormat,
                    memory: state.spinMemory.current
                  })
                : null);
            if (spun) {
              event.preventDefault();
              event.currentTarget.value = spun.text;
              event.currentTarget.setSelectionRange(spun.caret, spun.caret);
              state.setDraft(spun.text);
              state.setInvalid(false);
              state.setRecognition(recognitionOf(state.parse({ text: spun.text })));
              state.spinMemory.current = { key: spun.key, offset: spun.offset };
            }
          }
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") state.spinMemory.current = undefined;
          if (event.key === "Enter" && !event.defaultPrevented) state.commit();
        }}
        onCompositionStart={(event) => {
          state.composing.current = true;
          state.setRecognition(undefined);
          onCompositionStart?.(event);
        }}
        onCompositionEnd={(event) => {
          state.composing.current = false;
          const text = event.currentTarget.value;
          state.setDraft(text);
          state.setRecognition(recognitionOf(state.parse({ text })));
          onCompositionEnd?.(event);
        }}
      />
    </span>
  );
};
