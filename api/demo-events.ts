const MAX_BODY_BYTES = 8 * 1024 * 1024;

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

  const declaredBodyBytes = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredBodyBytes) && declaredBodyBytes > MAX_BODY_BYTES) {
    return jsonError(413, "Demo event payload is too large");
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return jsonError(400, "Invalid JSON event payload");
  }

  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return jsonError(413, "Demo event payload is too large");
  }

  let events: unknown;
  try {
    events = JSON.parse(body);
  } catch {
    return jsonError(400, "Invalid JSON event payload");
  }

  await wait(readDelay(request.url));
  return Response.json({ events }, { headers: { "Cache-Control": "no-store" } });
}

function readDelay(url: string): number {
  const requested = Number(new URL(url).searchParams.get("delay") ?? 0);
  return Number.isFinite(requested) ? Math.min(10_000, Math.max(0, requested)) : 0;
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export default { fetch };
