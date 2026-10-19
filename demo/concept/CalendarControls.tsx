import type { CalendarView } from "@quno/calendar/infinite-calendar";
export function CalendarControls({
  controls,
  view,
  setView,
  theme,
  setTheme,
  density,
  setDensity,
  zoom,
  setZoom
}: {
  controls: readonly string[];
  view: CalendarView;
  setView: (view: CalendarView) => void;
  theme: string;
  setTheme: (theme: string) => void;
  density: number;
  setDensity: (density: number) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
}) {
  if (!controls.length) return null;
  return (
    <div className="concept-controls">
      {controls.includes("view") && (
        <fieldset aria-label="Calendar view">
          {["horizontal", "vertical"].map((value) => (
            <button
              key={value}
              data-action={value}
              aria-pressed={view === `infinite-${value}`}
              onClick={() => setView(`infinite-${value}` as CalendarView)}
            >
              {value === "horizontal" ? "Horizontal" : "Vertical"}
            </button>
          ))}
        </fieldset>
      )}
      {controls.includes("theme") && (
        <fieldset aria-label="Calendar theme">
          {["light", "dark", "brand"].map((value) => (
            <button key={value} data-action={value} aria-pressed={theme === value} onClick={() => setTheme(value)}>
              {value === "brand" ? "Branded" : value === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </fieldset>
      )}
      {controls.includes("density") && (
        <fieldset aria-label="Event density">
          {[4, 40, 400].map((value, i) => (
            <button
              key={value}
              data-action={`density-${value}`}
              aria-pressed={density === value}
              onClick={() => setDensity(value)}
            >
              {["Quiet", "Busy", "Packed"][i]} · {value}
            </button>
          ))}
        </fieldset>
      )}
      {controls.includes("zoom") && (
        <fieldset aria-label="Zoom controls">
          <button aria-label="Zoom out" onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}>
            −
          </button>
          <input
            type="range"
            data-action="zoom"
            aria-label="Zoom level"
            min="0.5"
            max="8"
            step="0.01"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <button aria-label="Zoom in" onClick={() => setZoom(Math.min(8, zoom + 0.2))}>
            +
          </button>
        </fieldset>
      )}
    </div>
  );
}
