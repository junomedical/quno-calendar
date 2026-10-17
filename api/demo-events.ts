import { parseDemoEventQuery, queryDemoEvents } from "#quno-api/demo-event-service";

export const MAX_DEMO_QUERY_BYTES = 16 * 1024;

async function fetch(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      {
        status: 405,
        headers: { Allow: "POST", "Cache-Control": "no-store" }
      }
    );
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_DEMO_QUERY_BYTES) {
    return jsonError(413, "Demo query payload is too large");
  }
  let body: string;
  try {
    body = await request.text();
  } catch {
    return jsonError(400, "Invalid JSON query payload");
  }
  if (new TextEncoder().encode(body).byteLength > MAX_DEMO_QUERY_BYTES) {
    return jsonError(413, "Demo query payload is too large");
  }
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return jsonError(400, "Invalid JSON query payload");
  }
  const query = parseDemoEventQuery(value);
  if (!query) return jsonError(400, "Expected valid startDate, endDate, calendarIds and eventsPerYear");
  const requested = Number(new URL(request.url).searchParams.get("delay") ?? 0);
  const delay = Number.isFinite(requested) ? Math.min(10_000, Math.max(0, requested)) : 0;
  if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
  if (request.signal.aborted) return jsonError(499, "Request cancelled");
  return Response.json({ events: queryDemoEvents(query) }, { headers: { "Cache-Control": "no-store" } });
}

function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export default { fetch };
