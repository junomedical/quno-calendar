// @vitest-environment node
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { build } from "vite";
import { expect, it } from "vitest";

it("preserves local clock placement, full-event anchors and elapsed duration through both DST changes", async () => {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    publicDir: false,
    resolve: { alias: [{ find: /^#quno-internal\//, replacement: `${resolve("src/lib")}/` }] },
    build: {
      write: false,
      minify: false,
      lib: { entry: resolve("src/lib/timeline/infinite/interactions/timelineInteractionModel.ts"), formats: ["es"] }
    }
  });
  const outputs = Array.isArray(result) ? result : [result];
  const chunk = outputs
    .flatMap((output) => ("output" in output ? output.output : []))
    .find((output) => output.type === "chunk");
  if (!chunk || chunk.type !== "chunk") throw new Error("Missing timezone test bundle");
  const url = `data:text/javascript;base64,${Buffer.from(chunk.code).toString("base64")}`;
  const program = `
    import { buildMoveProposal } from ${JSON.stringify(url)};
    const results = [];
    for (const [before, after, destination] of [
      ['2026-03-28T12:00:00+01:00', '2026-03-29T12:00:00+02:00', '2026-03-30'],
      ['2026-10-24T12:00:00+02:00', '2026-10-25T12:00:00+01:00', '2026-10-26']
    ]) {
      const duration = Date.parse(after) - Date.parse(before);
      const event = { id: 'dst', calendarId: 'one', title: 'DST', start: before, end: after };
      const proposal = buildMoveProposal({ event, pointerOffsetMinutes: duration / 60000,
        settings: { startHour: 0, endHour: 24, snapMinutes: 15 },
        hit: { dateKey: destination, minute: 240, calendarId: 'one', dayIndex: 0, rowIndex: 0 } });
      const end = new Date(proposal.proposedEnd);
      results.push({ duration, movedDuration: Date.parse(proposal.proposedEnd) - Date.parse(proposal.proposedStart),
        endHour: end.getHours(), endDate: end.getDate() });
    }
    process.stdout.write(JSON.stringify(results));
  `;
  for (const timezone of ["Europe/Berlin", "America/New_York", "UTC"]) {
    const results = JSON.parse(
      execFileSync(process.execPath, ["--input-type=module", "-e", program], {
        encoding: "utf8",
        env: { ...process.env, TZ: timezone }
      })
    );
    expect(results).toEqual([
      { duration: 23 * 3600000, movedDuration: 23 * 3600000, endHour: 4, endDate: 30 },
      { duration: 25 * 3600000, movedDuration: 25 * 3600000, endHour: 4, endDate: 26 }
    ]);
  }
});
