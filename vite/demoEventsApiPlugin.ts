import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import demoEventsApi, { MAX_DEMO_QUERY_BYTES } from "#quno-api/demo-events";

/** Local development and preview use the same query handler as the deployed demo. */
export function demoEventsApiPlugin(): Plugin {
  return {
    name: "demo-events-api",
    configureServer(server) {
      server.middlewares.use("/api/demo-events", handleDemoEventsRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/demo-events", handleDemoEventsRequest);
    }
  };
}

function handleDemoEventsRequest(request: IncomingMessage, response: ServerResponse) {
  const chunks: Buffer[] = [];
  let bodyBytes = 0;
  request.on("data", (chunk: Buffer) => {
    bodyBytes += chunk.length;
    if (bodyBytes <= MAX_DEMO_QUERY_BYTES) chunks.push(chunk);
  });
  request.on("end", () => {
    if (bodyBytes > MAX_DEMO_QUERY_BYTES) {
      response.writeHead(413, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end(JSON.stringify({ error: "Demo query payload is too large" }));
      return;
    }
    const method = request.method ?? "GET";
    const webRequest = new Request(new URL(request.url ?? "", "http://demo.local"), {
      method,
      headers: { "Content-Type": "application/json" },
      ...(method === "GET" || method === "HEAD" ? {} : { body: Buffer.concat(chunks).toString("utf8") })
    });
    void demoEventsApi
      .fetch(webRequest)
      .then(async (result) => {
        response.writeHead(result.status, Object.fromEntries(result.headers.entries()));
        response.end(await result.text());
      })
      .catch(() => {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Demo query failed" }));
      });
  });
}
