import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { afterEach, describe, expect, it } from "vitest";

const projectRoot = resolve(".");
const architectureScript = join(projectRoot, "scripts", "check-architecture.mjs");
const bundleScript = join(projectRoot, "scripts", "check-bundle-size.mjs");
const temporaryDirectories: string[] = [];

function temporaryDirectory() {
  const directory = mkdtempSync(join(tmpdir(), "quno-calendar-guard-"));
  temporaryDirectories.push(directory);
  return directory;
}

function runScript(script: string, target: string) {
  return spawnSync(process.execPath, [script, target], { cwd: projectRoot, encoding: "utf8" });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("architecture guard", () => {
  it("accepts small production TypeScript modules", () => {
    const sourceRoot = temporaryDirectory();
    writeFileSync(
      join(sourceRoot, "small.ts"),
      "export function add(left: number, right: number) { return left + right; }\n"
    );

    const result = runScript(architectureScript, sourceRoot);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Architecture check passed for 1 production modules");
  });

  it("reports module and function line violations with locations", () => {
    const sourceRoot = temporaryDirectory();
    const functionLines = Array.from({ length: 121 }, (_, index) => `  const value${index} = ${index};`);
    const moduleLines = Array.from({ length: 85 }, (_, index) => `export const extra${index} = ${index};`);
    writeFileSync(
      join(sourceRoot, "large.ts"),
      [`export function tooLarge() {`, ...functionLines, "}", ...moduleLines, ""].join("\n")
    );

    const result = runScript(architectureScript, sourceRoot);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/large\.ts: 208 non-comment lines \(module limit: 200\)/);
    expect(result.stderr).toMatch(/large\.ts:1-123: tooLarge spans 123 source lines \(function limit: 120\)/);
  });

  it("rejects deep relative imports in favor of the library alias", () => {
    const sourceRoot = temporaryDirectory();
    const nestedDirectory = join(sourceRoot, "infinite", "rendering", "shared");
    mkdirSync(nestedDirectory, { recursive: true });
    writeFileSync(
      join(nestedDirectory, "eventShell.ts"),
      'import type { CalendarEvent } from "../../../core/types";\nexport type Event = CalendarEvent;\n'
    );

    const result = runScript(architectureScript, sourceRoot);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("use #calendar-internal/* instead of deep relative import ../../../core/types");
  });
});

describe("bundle-size guard", () => {
  it("prints raw and gzip sizes for passing ESM and CSS artifacts", () => {
    const distRoot = temporaryDirectory();
    writeFileSync(join(distRoot, "quno-calendar.js"), "export const value = 1;\n".repeat(100));
    writeFileSync(join(distRoot, "styles.css"), ".calendar { display: grid; }\n".repeat(20));

    const result = runScript(bundleScript, distRoot);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/ESM .*: raw .* gzip/);
    expect(result.stdout).toMatch(/CSS .*: raw .* gzip/);
    expect(result.stdout).toContain("Bundle size check passed.");
  });

  it("fails clearly for missing build artifacts", () => {
    const result = runScript(bundleScript, temporaryDirectory());
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Missing ESM bundle");
    expect(result.stderr).toContain("Build the library first with `npm run build:lib`.");
  });

  it("enforces the 32 KiB ESM gzip ceiling", () => {
    const distRoot = temporaryDirectory();
    mkdirSync(distRoot, { recursive: true });
    const incompressibleSource = randomBytes(40 * 1024).toString("base64");
    writeFileSync(join(distRoot, "quno-calendar.js"), incompressibleSource);
    writeFileSync(join(distRoot, "styles.css"), ".calendar{}\n");

    const result = runScript(bundleScript, distRoot);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("ESM exceeds its gzip limit");
  });
});
