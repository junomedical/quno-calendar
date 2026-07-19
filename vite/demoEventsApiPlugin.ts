import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const DEMO_EVENTS_PATH = "/api/demo-events";
const MAX_BODY_BYTES = 8 * 1024 * 1024;

/** Local-only mock transport used to demonstrate a genuinely asynchronous HTTP event source. */
export function demoEventsApiPlugin(): Plugin {
  return {
    name: "demo-events-api",
    configureServer(server) {
      server.middlewares.use(DEMO_EVENTS_PATH, handleDemoEventsRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(DEMO_EVENTS_PATH, handleDemoEventsRequest);
    }
  };
}

function handleDemoEventsRequest(request: IncomingMessage, response: ServerResponse, next: () => void) {
  if (request.method !== "POST") {
    next();
    return;
  }

  const chunks: Buffer[] = [];
  let bodyBytes = 0;
  request.on("data", (chunk: Buffer) => {
    bodyBytes += chunk.length;
    if (bodyBytes <= MAX_BODY_BYTES) chunks.push(chunk);
  });
  request.on("end", () => {
    if (bodyBytes > MAX_BODY_BYTES) {
      respondJson(response, 413, { error: "Demo event payload is too large" });
      return;
    }
    setTimeout(() => {
      try {
        const events = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        respondJson(response, 200, { events });
      } catch {
        respondJson(response, 400, { error: "Invalid JSON event payload" });
      }
    }, readDelay(request.url));
  });
}

function readDelay(url = ""): number {
  const requested = Number(new URL(url, "http://demo.local").searchParams.get("delay") ?? 0);
  return Number.isFinite(requested) ? Math.min(10_000, Math.max(0, requested)) : 0;
}

function respondJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}
