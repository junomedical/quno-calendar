import { classNames as cx } from "./classNames";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ResolvedDatePickerConfig } from "./datePickerTypes";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { JSX } from "react";

type Props = {
  visibleMonth: IsoDate;
  config: ResolvedDatePickerConfig;
  onSelect: (month: IsoDate) => void;
};

const CHUNK_SIZE = 25;
const INITIAL_RADIUS = 100;
const OVERSCAN_YEARS = 2;
const DEFAULT_YEAR_HEIGHT = 222;
const DEFAULT_VIEWPORT_HEIGHT = 326;
const SCROLL_SETTLE_DELAY = 120;
const monthIso = (year: number, month: number): IsoDate =>
  `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01` as IsoDate;

export const MonthNavigation = ({ visibleMonth, config, onSelect }: Props): JSX.Element => {
  const visibleYear = Number(visibleMonth.slice(0, 4));
  const [firstYear, setFirstYear] = useState(visibleYear - INITIAL_RADIUS);
  const [lastYear, setLastYear] = useState(visibleYear + INITIAL_RADIUS);
  const [viewportTop, setViewportTop] = useState(INITIAL_RADIUS * DEFAULT_YEAR_HEIGHT);
  const [viewportHeight, setViewportHeight] = useState(DEFAULT_VIEWPORT_HEIGHT);
  const [yearHeight, setYearHeight] = useState(DEFAULT_YEAR_HEIGHT);
  const scroller = useRef<HTMLDivElement>(null);
  const prependSnapshot = useRef<{ height: number; top: number } | null>(null);
  const loadingEdge = useRef(false);
  const edgeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { labels, formatters, locale, classNames } = config;
  const yearCount = lastYear - firstYear + 1;
  const firstVisibleIndex = Math.max(0, Math.floor(viewportTop / yearHeight) - OVERSCAN_YEARS);
  const renderedYearCount = Math.ceil(viewportHeight / yearHeight) + OVERSCAN_YEARS * 2;
  const lastVisibleIndex = Math.min(yearCount, firstVisibleIndex + renderedYearCount);
  const renderedYears = Array.from(
    { length: lastVisibleIndex - firstVisibleIndex },
    (_, index) => firstYear + firstVisibleIndex + index
  );

  useLayoutEffect(() => {
    const container = scroller.current;
    if (!container) return;
    const top = INITIAL_RADIUS * yearHeight;
    container.scrollTop = top;
    setViewportTop(top);
    setViewportHeight(container.clientHeight || DEFAULT_VIEWPORT_HEIGHT);
  }, [yearHeight]);

  useLayoutEffect(() => {
    const container = scroller.current;
    const year = container?.querySelector<HTMLElement>('[data-slot="year-group"]');
    const measured = year?.getBoundingClientRect().height ?? 0;
    if (measured > 0 && measured !== yearHeight) setYearHeight(measured);
  }, [yearHeight]);

  useLayoutEffect(() => {
    const container = scroller.current;
    const snapshot = prependSnapshot.current;
    if (container && snapshot) {
      const top = snapshot.top + container.scrollHeight - snapshot.height;
      container.scrollTop = top;
      setViewportTop(top);
      prependSnapshot.current = null;
    }
    loadingEdge.current = false;
  }, [firstYear, lastYear]);

  useEffect(
    () => () => {
      if (edgeTimer.current) clearTimeout(edgeTimer.current);
    },
    []
  );

  const extendYearsAtRest = (): void => {
    const container = scroller.current;
    if (!container || loadingEdge.current) return;
    if (container.scrollTop < 64) {
      loadingEdge.current = true;
      prependSnapshot.current = {
        height: container.scrollHeight,
        top: container.scrollTop
      };
      setFirstYear((year) => year - CHUNK_SIZE);
      return;
    }
    const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (remaining < 64) {
      loadingEdge.current = true;
      setLastYear((year) => year + CHUNK_SIZE);
    }
  };

  const handleScroll = (): void => {
    const container = scroller.current;
    if (!container) return;
    setViewportTop(container.scrollTop);
    setViewportHeight(container.clientHeight || DEFAULT_VIEWPORT_HEIGHT);
    if (edgeTimer.current) clearTimeout(edgeTimer.current);
    edgeTimer.current = setTimeout(extendYearsAtRest, SCROLL_SETTLE_DELAY);
  };

  return (
    <div
      ref={scroller}
      className={cx("quno-date-picker-month-navigation", classNames?.monthNavigation)}
      data-slot="month-navigation"
      data-first-year={firstYear}
      data-last-year={lastYear}
      data-rendered-years={renderedYears.length}
      role="group"
      aria-label={labels.monthNavigation}
      onScroll={handleScroll}
    >
      <div
        className="quno-date-picker-year-spacer"
        style={{ height: `${firstVisibleIndex * yearHeight}px` }}
        aria-hidden="true"
      />
      {renderedYears.map((year) => (
        <section
          key={year}
          className={cx("quno-date-picker-year-group", classNames?.yearGroup)}
          data-slot="year-group"
          data-year={year}
        >
          <h3 className={classNames?.yearHeading} data-slot="year-heading" data-year-tone={year % 2 ? "odd" : "even"}>
            {formatters.year(monthIso(year, 1), locale)}
          </h3>
          <div className="quno-date-picker-month-options">
            {Array.from({ length: 12 }, (_, index) => {
              const month = monthIso(year, index + 1);
              const current = month === visibleMonth;
              return (
                <button
                  key={month}
                  type="button"
                  className={cx("quno-date-picker-month-option", classNames?.monthOption)}
                  data-slot="month-option"
                  data-month={month.slice(0, 7)}
                  data-year-tone={year % 2 ? "odd" : "even"}
                  aria-label={formatters.month(month, locale)}
                  aria-current={current ? "date" : undefined}
                  onClick={() => onSelect(month)}
                >
                  {formatters.monthOption(month, locale)}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <div
        className="quno-date-picker-year-spacer"
        style={{ height: `${(yearCount - lastVisibleIndex) * yearHeight}px` }}
        aria-hidden="true"
      />
    </div>
  );
};
