import {
  applyDateAction,
  compareDates,
  dateActionContext,
  isWithinRange,
  moveRange,
  normalizeRange,
  type DateRange,
  type Endpoint,
  type IsoDate
} from "#quno-internal/shared/dateRangeModel";
import type { DatePickerInteraction, IdleInteraction } from "./datePickerTypes";

export type DateClickCycle = {
  date: IsoDate;
  original: DateRange;
  actions: [Endpoint, Endpoint, "single"];
  index: number;
  value: DateRange;
};

export const idle = (): IdleInteraction => ({ type: "idle" });

const endpointDrag = (selection: DateRange, endpoint: Endpoint, date: IsoDate): DatePickerInteraction => ({
  type: "drag-endpoint",
  endpoint,
  origin: date,
  anchor: endpoint === "start" ? selection.end : selection.start,
  current: selection,
  moved: false
});

export const beginInteraction = (selection: DateRange | null, date: IsoDate): DatePickerInteraction => {
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
    return endpointDrag(selection, endpointHit, date);
  }

  if (isWithinRange(date, selection)) {
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

export const updateInteraction = (interaction: DatePickerInteraction, date: IsoDate): DatePickerInteraction => {
  if (interaction.type === "idle") {
    return interaction;
  }

  if (interaction.type === "create") {
    return {
      ...interaction,
      current: normalizeRange(interaction.origin, date),
      moved: interaction.moved || date !== interaction.origin
    };
  }

  if (interaction.type === "paint-pending") {
    if (date === interaction.origin) return interaction;
    return {
      type: "create",
      origin: interaction.origin,
      current: normalizeRange(interaction.origin, date),
      moved: true
    };
  }

  if (interaction.type === "drag-range") {
    return {
      ...interaction,
      current: moveRange(interaction.original, interaction.origin, date),
      moved: interaction.moved || date !== interaction.origin
    };
  }

  return {
    ...interaction,
    endpoint: compareDates(date, interaction.anchor) <= 0 ? "start" : "end",
    current: normalizeRange(interaction.anchor, date),
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
    const value = applyDateAction(cycle.original, cycle.date, cycle.actions[index]);
    if (value.start !== cycle.value.start || value.end !== cycle.value.end) {
      const nextCycle = index === cycle.actions.length - 1 ? null : { ...cycle, index, value };
      return { cycle: nextCycle, value, changed: true };
    }
  }
  return { cycle: null, value: cycle.value, changed: false };
};

export const finishInteraction = (interaction: DatePickerInteraction, date: IsoDate): InteractionResult => {
  if (interaction.type === "idle") {
    return { interaction };
  }

  if (interaction.type === "paint-pending" && date !== interaction.origin) {
    return {
      interaction: idle(),
      value: normalizeRange(interaction.origin, date)
    };
  }

  if (interaction.moved) {
    const finalInteraction = updateInteraction(interaction, date);
    if (finalInteraction.type === "idle") {
      return { interaction: finalInteraction };
    }
    return { interaction: idle(), value: finalInteraction.current };
  }

  if (interaction.type === "create") {
    return { interaction: idle(), value: { start: date, end: date } };
  }

  const original = interaction.type === "paint-pending" ? interaction.original : interaction.current;
  const context = dateActionContext(original, date);
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
