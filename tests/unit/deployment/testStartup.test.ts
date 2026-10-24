import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { expect, it } from "vitest";

it("runs API tests in a clean checkout without generated server or library assets", () => {
  const directory = mkdtempSync(join(tmpdir(), "quno-test-startup-"));
  try {
    for (const path of [
      "package.json",
      "tsconfig.json",
      "vite.config.ts",
      "vitest.config.ts",
      "vite",
      "api",
      "demo",
      "src",
      "tests/setup.ts",
      "tests/unit/api/demoEvents.test.ts"
    ]) {
      if (!existsSync(resolve(path))) continue;
      const destination = join(directory, path);
      mkdirSync(dirname(destination), { recursive: true });
      cpSync(resolve(path), destination, { recursive: true });
    }
    symlinkSync(resolve("node_modules"), join(directory, "node_modules"), "junction");
    const result = execFileSync(
      process.execPath,
      [resolve("node_modules/vitest/vitest.mjs"), "run", "tests/unit/api/demoEvents.test.ts", "--maxWorkers=1"],
      { cwd: directory, encoding: "utf8", env: { ...process.env, NODE_ENV: "test" }, timeout: 20_000 }
    );
    expect(result).toContain("passed");
    expect(existsSync(join(directory, "build"))).toBe(false);
    expect(existsSync(join(directory, "dist"))).toBe(false);
    expect(existsSync(join(directory, "dist-demo"))).toBe(false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 25_000);
