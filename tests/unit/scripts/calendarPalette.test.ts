import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const renderingRoot = resolve("src/lib/infinite/rendering");
const palettePath = resolve(renderingRoot, "styles/palette.css");
const colorLiteralPattern = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi;

function renderingSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? renderingSourceFiles(path) : [path];
  });
}

describe("calendar palette", () => {
  it("keeps reusable rendering color literals in the palette only", () => {
    const offenders = renderingSourceFiles(renderingRoot)
      .filter((path) => path !== palettePath)
      .flatMap((path) =>
        [...readFileSync(path, "utf8").matchAll(colorLiteralPattern)].map(
          (match) => `${relative(renderingRoot, path)}: ${match[0]}`
        )
      );

    expect(offenders).toEqual([]);
  });
});
