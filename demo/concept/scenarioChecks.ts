export type Check = (value: unknown, path: string) => void;
export function requireValue(condition: unknown, path: string, expected: string): asserts condition {
  if (!condition) throw new Error(`Invalid scenario JSON at ${path}: expected ${expected}`);
}
export const text: Check = (value, path) => requireValue(typeof value === "string", path, "text");
export const nonempty: Check = (value, path) =>
  requireValue(typeof value === "string" && value.trim().length > 0, path, "nonempty text");
export const boolean: Check = (value, path) => requireValue(typeof value === "boolean", path, "boolean");
export const number: Check = (value, path) =>
  requireValue(typeof value === "number" && Number.isFinite(value), path, "finite number");
export const between =
  (min: number, max: number, integer = false): Check =>
  (value, path) => {
    number(value, path);
    requireValue(
      (value as number) >= min && (value as number) <= max && (!integer || Number.isInteger(value)),
      path,
      `${integer ? "integer" : "number"} between ${min} and ${max}`
    );
  };
export const oneOf =
  (...values: (string | number)[]): Check =>
  (value, path) =>
    requireValue(
      values.some((item) => item === value),
      path,
      values.join(" | ")
    );
export const nullable =
  (check: Check): Check =>
  (value, path) => {
    if (value !== null) check(value, path);
  };
export const array =
  (check: Check, min = 0): Check =>
  (value, path) => {
    requireValue(Array.isArray(value) && value.length >= min, path, `array with at least ${min} entries`);
    value.forEach((item, index) => check(item, `${path}[${index}]`));
  };
export const object =
  (required: Record<string, Check>, optional: Record<string, Check> = {}): Check =>
  (value, path) => {
    requireValue(value && typeof value === "object" && !Array.isArray(value), path, "object");
    const record = value as Record<string, unknown>;
    for (const [key, check] of Object.entries(required)) check(record[key], `${path}.${key}`);
    for (const key of Object.keys(record)) {
      if (Object.prototype.hasOwnProperty.call(required, key)) continue;
      requireValue(Object.prototype.hasOwnProperty.call(optional, key), `${path}.${key}`, "known field");
      optional[key](record[key], `${path}.${key}`);
    }
  };
export const date: Check = (value, path) => {
  requireValue(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value), path, "ISO date");
  const parsed = new Date(`${value}T00:00:00Z`);
  requireValue(Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value, path, "valid date");
};
export const range: Check = (value, path) => {
  object({ start: date, end: date })(value, path);
  const bounds = value as { start: string; end: string };
  requireValue(bounds.start <= bounds.end, path, "ordered date range");
};
export const clock: Check = (value, path) =>
  requireValue(typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value), path, "HH:mm clock");
