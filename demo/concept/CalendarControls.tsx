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
  zoomRange,
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
  zoomRange: { minimum: number; maximum: number };
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
          {[4, 20, 60].map((value, i) => (
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
          <button
            aria-label="Zoom out"
            disabled={zoom <= zoomRange.minimum}
            onClick={() => setZoom(Math.max(zoomRange.minimum, Number((zoom - 0.2).toFixed(2))))}
          >
            −
          </button>
          <input
            type="range"
            data-action="zoom"
            aria-label="Zoom level"
            min={zoomRange.minimum}
            max={zoomRange.maximum}
            step="0.01"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <button
            aria-label="Zoom in"
            disabled={zoom >= zoomRange.maximum}
            onClick={() => setZoom(Math.min(zoomRange.maximum, Number((zoom + 0.2).toFixed(2))))}
          >
            +
          </button>
        </fieldset>
      )}
    </div>
  );
}
