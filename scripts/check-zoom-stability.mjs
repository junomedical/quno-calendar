import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(".");
const failures = [];

function source(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function requireText(path, pattern, reason) {
  if (!pattern.test(source(path))) failures.push(`${path}: ${reason}`);
}

function forbidText(path, pattern, reason) {
  if (pattern.test(source(path))) failures.push(`${path}: ${reason}`);
}

for (const path of ["demo/showcase/DefaultDemo.tsx", "demo/showcase/preset/PresetDemo.tsx"]) {
  requireText(path, /<DemoZoomProvider\b/, "showcase zoom state must stay inside the narrow zoom provider");
  requireText(path, /<DemoCalendarRoot\b/, "showcase calendars must subscribe through the isolated zoom wrapper");
  forbidText(path, /<CalendarRoot\b/, "do not make the full showcase tree subscribe to controlled zoom");
}

for (const contextName of ["DemoCalendarZoomContext", "DemoZoomControlContext"]) {
  requireText(
    "demo/showcase/zoom/DemoZoom.tsx",
    new RegExp(`createContext<[^;]+${contextName}|const ${contextName} = createContext`),
    "calendar projection and sidebar readout must use separate zoom subscriptions"
  );
}
requireText(
  "demo/showcase/zoom/DemoZoom.tsx",
  /GESTURE_READOUT_SETTLE_MS/,
  "gesture zoom must defer the sidebar readout until the burst settles"
);

for (const path of ["demo/showcase/default/DefaultDemoSidebar.tsx", "demo/showcase/preset/PresetDemoSidebar.tsx"]) {
  requireText(path, /<DemoZoomControl\b/, "only the zoom control should subscribe to showcase zoom state");
  requireText(path, /demo-control-pane/, "the control pane must expose the stable sidebar selector");
}

forbidText(
  "demo/showcase/hooks/useDemoControls.ts",
  /useState\(defaults\.zoom\)/,
  "general demo controls must not own zoom state and redraw the showcase tree"
);
requireText(
  "src/lib/time/timelineTicks.ts",
  /minute \+= STABLE_TICK_CADENCE_MINUTES/,
  "time labels must keep a zoom-independent DOM skeleton"
);
requireText(
  "src/lib/infinite/rendering/shared/TimeScaleHeader.tsx",
  /tick\.isHour \? tick\.label : <sup>\{tick\.label\}<\/sup>/,
  "hidden time-label children must remain mounted across zoom thresholds"
);
requireText(
  "src/lib/infinite/rendering/styles/base.css",
  /\.ic-shell\s*\{[^}]*contain:\s*paint;/s,
  "the calendar shell must contain zoom paint invalidation"
);
requireText(
  "src/lib/infinite/scroll/window/useVerticalProjectionRenderWindow.ts",
  /overrideRef/,
  "vertical zoom must retain the semantic date window while virtualizer measurements settle"
);
requireText(
  "src/lib/infinite/scroll/window/renderItems.ts",
  /forcedBaseGeometryAnchorIndex/,
  "vertical zoom must render stable base-day geometry before paint"
);
requireText(
  "src/lib/infinite/interactions/zoom/shiftWheelZoomUtils.ts",
  /useFrameCoalescedWheelZoom/,
  "wheel and touchpad bursts must be coalesced before controlled zoom commits"
);
for (const path of [
  "src/lib/infinite/interactions/zoom/useHorizontalShiftWheelZoom.ts",
  "src/lib/infinite/interactions/zoom/useVerticalShiftWheelZoom.ts"
]) {
  requireText(path, /useFrameCoalescedWheelZoom/, "both wheel projections must use frame-coalesced zoom commits");
}
requireText(
  "demo/app/App.css",
  /\.demo-zoom-paint-boundary\s*\{[^}]*contain:\s*layout paint;[^}]*transform:\s*translateZ\(0\);[^}]*will-change:\s*transform;/s,
  "the frequently changing zoom control must own a narrow paint and compositor boundary"
);
requireText(
  "demo/app/App.css",
  /\.demo-stats\s*\{[^}]*contain:\s*layout paint;[^}]*transform:\s*translateZ\(0\);[^}]*will-change:\s*transform;/s,
  "the independently updating stats panel must own a narrow paint and compositor boundary"
);
requireText(
  "demo/app/App.css",
  /\.demo-sidebar\s*\{[^}]*transform:\s*translateZ\(0\);[^}]*will-change:\s*transform;/s,
  "the stable sidebar must stay on a compositor layer outside calendar raster work"
);
forbidText(
  "demo/app/App.css",
  /\.demo-control-pane\s*\{[^}]*contain:\s*paint;/s,
  "do not make a zoom-value change invalidate a full-sidebar paint boundary"
);

if (failures.length) {
  for (const failure of failures) console.error(failure);
  console.error(`Zoom stability check failed with ${failures.length} problem(s).`);
  process.exitCode = 1;
} else {
  console.log("Zoom stability check passed: subscriptions, DOM identity, and paint boundaries are isolated.");
}
