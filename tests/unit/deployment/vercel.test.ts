import { describe, expect, it } from "vitest";
import vercelConfig from "#quno-project/vercel.json";

describe("Vercel deployment configuration", () => {
  it("publishes the runnable demo with SPA route fallback", () => {
    expect(vercelConfig.framework).toBe("vite");
    expect(vercelConfig.buildCommand).toBe("npm run build:demo");
    expect(vercelConfig.outputDirectory).toBe("dist-demo");
    expect(vercelConfig.rewrites).toContainEqual({ source: "/(.*)", destination: "/index.html" });
  });
});
