import {
  compareDates,
  isWithinRange,
  normalizeRange,
  type DateRange,
  type IsoDate
} from "#quno-internal/shared/dateRangeModel";
import {
  applyDateAction,
  dateActionContext,
  moveRange,
  type Endpoint
} from "#quno-internal/date-picker/datePickerModel";
import type { DatePickerInteraction, IdleInteraction } from "./datePickerTypes";

export type DateClickCycle = {
  date: IsoDate;
  original: DateRange;
  actions: [Endpoint, Endpoint, "single"];
  index: number;
  value: DateRange;
};

export const idle = (): IdleInteraction => ({ type: "idle" });

const endpointDrag = ({
  selection,
  endpoint,
  date
}: {
  selection: DateRange;
  endpoint: Endpoint;
  date: IsoDate;
}): DatePickerInteraction => ({
  type: "drag-endpoint",
  endpoint,
  origin: date,
  anchor: endpoint === "start" ? selection.end : selection.start,
  current: selection,
  moved: false
});

export const beginInteraction = ({
  selection,
  date
}: {
  selection: DateRange | null;
  date: IsoDate;
}): DatePickerInteraction => {
  if (!selection) {
    return {
      type: "create",
      origin: date,
      current: { start: date, end: date },
      moved: false
    };
  }

  const endpointHit = date === selection.start ? "start" : date === selection.end ? "end" : null;
  if (endpointHit) {
    return endpointDrag({ selection, endpoint: endpointHit, date });
  }

  if (isWithinRange({ date, range: selection })) {
    return {
      type: "drag-range",
      origin: date,
      original: selection,
      current: selection,
      moved: false
    };
  }

  return {
    type: "paint-pending",
    origin: date,
    original: selection,
    current: selection,
    moved: false
  };
};

export const updateInteraction = ({
  interaction,
  date
}: {
  interaction: DatePickerInteraction;
  date: IsoDate;
}): DatePickerInteraction => {
  if (interaction.type === "idle") {
    return interaction;
  }

  if (interaction.type === "create") {
    return {
      ...interaction,
      current: normalizeRange({ first: interaction.origin, second: date }),
      moved: interaction.moved || date !== interaction.origin
    };
  }

  if (interaction.type === "paint-pending") {
    if (date === interaction.origin) return interaction;
    return {
      type: "create",
      origin: interaction.origin,
      current: normalizeRange({ first: interaction.origin, second: date }),
      moved: true
    };
  }

  if (interaction.type === "drag-range") {
    return {
      ...interaction,
      current: moveRange({ range: interaction.original, origin: interaction.origin, date }),
      moved: interaction.moved || date !== interaction.origin
    };
  }

  return {
    ...interaction,
    endpoint: compareDates({ left: date, right: interaction.anchor }) <= 0 ? "start" : "end",
    current: normalizeRange({ first: interaction.anchor, second: date }),
    moved: interaction.moved || date !== interaction.origin
  };
};

export type InteractionResult = {
  interaction: DatePickerInteraction;
  value?: DateRange;
  cycle?: DateClickCycle;
};

export const advanceDateClickCycle = (
  cycle: DateClickCycle
): { cycle: DateClickCycle | null; value: DateRange; changed: boolean } => {
  for (let index = cycle.index + 1; index < cycle.actions.length; index += 1) {
    const value = applyDateAction({ range: cycle.original, date: cycle.date, action: cycle.actions[index] });
    if (value.start !== cycle.value.start || value.end !== cycle.value.end) {
      const nextCycle = index === cycle.actions.length - 1 ? null : { ...cycle, index, value };
      return { cycle: nextCycle, value, changed: true };
    }
  }
  return { cycle: null, value: cycle.value, changed: false };
};

export const finishInteraction = ({
  interaction,
  date
}: {
  interaction: DatePickerInteraction;
  date: IsoDate;
}): InteractionResult => {
  if (interaction.type === "idle") {
    return { interaction };
  }

  if (interaction.type === "paint-pending" && date !== interaction.origin) {
    return {
      interaction: idle(),
      value: normalizeRange({ first: interaction.origin, second: date })
    };
  }

  if (interaction.moved) {
    const finalInteraction = updateInteraction({ interaction, date });
    if (finalInteraction.type === "idle") {
      return { interaction: finalInteraction };
    }
    return { interaction: idle(), value: finalInteraction.current };
  }

  if (interaction.type === "create") {
    return { interaction: idle(), value: { start: date, end: date } };
  }

  const original = interaction.type === "paint-pending" ? interaction.original : interaction.current;
  const context = dateActionContext({ range: original, date });
  const opposite = context.defaultAction === "start" ? "end" : "start";
  const actions: DateClickCycle["actions"] = [context.defaultAction, opposite, "single"];
  const next = advanceDateClickCycle({
    date,
    original,
    actions,
    index: -1,
    value: original
  });
  return {
    interaction: idle(),
    value: next.changed ? next.value : undefined,
    cycle: next.cycle ?? undefined
  };
};
