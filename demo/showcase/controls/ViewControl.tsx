import type { CalendarView } from "#quno-demo/showcase/types";

type ViewControlProps = {
  className: string;
  inputName: string;
  view: CalendarView;
  onChange: (view: CalendarView) => void;
};

export function ViewControl({ className, inputName, view, onChange }: ViewControlProps) {
  return (
    <fieldset className={className} aria-label="Calendar type">
      <legend>Calendar type</legend>
      <ViewOption
        checked={view === "infinite-horizontal"}
        inputName={inputName}
        label="Infinite Horizontal"
        testId="view-infinite-horizontal"
        value="infinite-horizontal"
        onChange={onChange}
      />
      <ViewOption
        checked={view === "infinite-vertical"}
        inputName={inputName}
        label="Infinite Vertical"
        testId="view-infinite-vertical"
        value="infinite-vertical"
        onChange={onChange}
      />
    </fieldset>
  );
}

type ViewOptionProps = {
  checked: boolean;
  inputName: string;
  label: string;
  testId: string;
  value: CalendarView;
  onChange: (view: CalendarView) => void;
};

function ViewOption({ checked, inputName, label, testId, value, onChange }: ViewOptionProps) {
  return (
    <label>
      <input
        type="radio"
        name={inputName}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        data-testid={testId}
      />
      <span>{label}</span>
    </label>
  );
}
