import { describe, expect, it } from "vitest";
import demoEventsApi from "../../../api/demo-events";

describe("Vercel demo events API", () => {
  it("returns posted events using the production Web handler", async () => {
    const events = [{ id: "event-1", title: "Visit" }];
    const request = new Request("https://calendar.example/api/demo-events?delay=0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(events)
    });

    const response = await demoEventsApi.fetch(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ events });
  });

  it("rejects unsupported methods and malformed JSON", async () => {
    const getResponse = await demoEventsApi.fetch(new Request("https://calendar.example/api/demo-events"));
    const invalidResponse = await demoEventsApi.fetch(
      new Request("https://calendar.example/api/demo-events", { method: "POST", body: "{" })
    );

    expect(getResponse.status).toBe(405);
    expect(getResponse.headers.get("Allow")).toBe("POST");
    expect(invalidResponse.status).toBe(400);
  });
});
