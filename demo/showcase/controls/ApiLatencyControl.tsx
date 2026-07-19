export const DEMO_API_LATENCIES_MS = [0, 250, 1_000, 3_000] as const;

type ApiLatencyControlProps = {
  latencyMs: number;
  pendingRequestCount: number;
  onChange: (latencyMs: number) => void;
};

function latencyLabel(latencyMs: number): string {
  if (latencyMs === 0) return "Instant";
  if (latencyMs < 1_000) return `${latencyMs} ms`;
  return `${latencyMs / 1_000} s`;
}

/** Selects an abort-aware delay applied to every demo event-range request. */
export function ApiLatencyControl({ latencyMs, pendingRequestCount, onChange }: ApiLatencyControlProps) {
  const isLoading = pendingRequestCount > 0;
  return (
    <div className="api-latency-control">
      <label>
        API delay
        <select
          value={latencyMs}
          onChange={(event) => onChange(Number(event.target.value))}
          data-testid="api-latency-select"
        >
          {DEMO_API_LATENCIES_MS.map((value) => (
            <option value={value} key={value}>
              {latencyLabel(value)}
            </option>
          ))}
        </select>
      </label>
      <span
        className={`api-loading-status${isLoading ? " is-loading" : ""}`}
        data-testid="api-loading-status"
        role="status"
        aria-live="polite"
      >
        <span className="api-loading-dot" aria-hidden />
        {isLoading
          ? `Loading events from API${pendingRequestCount > 1 ? ` (${pendingRequestCount})` : ""}…`
          : "API idle"}
      </span>
    </div>
  );
}
