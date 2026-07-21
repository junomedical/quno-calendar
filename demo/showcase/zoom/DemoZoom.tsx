import {
  useCallback,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  CalendarRoot,
  type CalendarNavigationHandle,
  type CalendarRootProps,
  type TimelineSettings
} from "quno-calendar";
import { ZoomControl } from "../controls/TimelineControls";

type DemoCalendarZoomValue = {
  zoom: number;
  requestZoom: (zoom: number) => void;
};

type DemoZoomControlValue = {
  displayedZoom: number;
  setZoomFromControl: (zoom: number) => void;
};

const DemoCalendarZoomContext = createContext<DemoCalendarZoomValue | null>(null);
const DemoZoomControlContext = createContext<DemoZoomControlValue | null>(null);
const GESTURE_READOUT_SETTLE_MS = 300;

export type DemoTimelineSettings = Omit<TimelineSettings, "zoom">;

export function DemoZoomProvider({ initialZoom, children }: { initialZoom: number; children: ReactNode }) {
  const [zoom, setZoom] = useState(initialZoom);
  const [displayedZoom, setDisplayedZoom] = useState(initialZoom);
  const readoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearReadoutTimer = useCallback(() => {
    if (readoutTimerRef.current) clearTimeout(readoutTimerRef.current);
    readoutTimerRef.current = null;
  }, []);
  const requestZoom = useCallback(
    (nextZoom: number) => {
      setZoom(nextZoom);
      clearReadoutTimer();
      readoutTimerRef.current = setTimeout(() => {
        readoutTimerRef.current = null;
        setDisplayedZoom(nextZoom);
      }, GESTURE_READOUT_SETTLE_MS);
    },
    [clearReadoutTimer]
  );
  const setZoomFromControl = useCallback(
    (nextZoom: number) => {
      clearReadoutTimer();
      setZoom(nextZoom);
      setDisplayedZoom(nextZoom);
    },
    [clearReadoutTimer]
  );
  const calendarValue = useMemo(() => ({ zoom, requestZoom }), [requestZoom, zoom]);
  const controlValue = useMemo(() => ({ displayedZoom, setZoomFromControl }), [displayedZoom, setZoomFromControl]);

  useEffect(() => clearReadoutTimer, [clearReadoutTimer]);

  return (
    <DemoCalendarZoomContext.Provider value={calendarValue}>
      <DemoZoomControlContext.Provider value={controlValue}>{children}</DemoZoomControlContext.Provider>
    </DemoCalendarZoomContext.Provider>
  );
}

function useDemoCalendarZoom() {
  const value = useContext(DemoCalendarZoomContext);
  if (!value) throw new Error("useDemoCalendarZoom must be used inside DemoZoomProvider");
  return value;
}

function useDemoZoomControl() {
  const value = useContext(DemoZoomControlContext);
  if (!value) throw new Error("useDemoZoomControl must be used inside DemoZoomProvider");
  return value;
}

export function DemoZoomControl({ className }: { className: string }) {
  const { displayedZoom, setZoomFromControl } = useDemoZoomControl();
  return (
    <div className="demo-zoom-paint-boundary">
      <ZoomControl className={className} zoom={displayedZoom} onChange={setZoomFromControl} />
    </div>
  );
}

type DemoCalendarRootProps = Omit<CalendarRootProps, "settings" | "onZoomChange"> & {
  settings: DemoTimelineSettings;
};

export const DemoCalendarRoot = forwardRef<CalendarNavigationHandle, DemoCalendarRootProps>(function DemoCalendarRoot(
  { settings: settingsWithoutZoom, ...props },
  ref
) {
  const { zoom, requestZoom } = useDemoCalendarZoom();
  const settings = useMemo(() => ({ ...settingsWithoutZoom, zoom }), [settingsWithoutZoom, zoom]);

  return <CalendarRoot {...props} ref={ref} settings={settings} onZoomChange={requestZoom} />;
});
