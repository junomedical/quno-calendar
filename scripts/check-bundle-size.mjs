import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import process from "node:process";
import { gzipSync } from "node:zlib";

const KIB = 1024;
const projectRoot = resolve(".");
const distRoot = resolve(process.argv[2] ?? "dist");
const bundles = [
  { label: "Shared root JavaScript", path: resolve(distRoot, "index.js"), gzipLimit: 2 * KIB },
  { label: "Infinite Calendar JavaScript", path: resolve(distRoot, "infinite-calendar.js"), gzipLimit: 34 * KIB },
  { label: "Infinite Calendar CSS", path: resolve(distRoot, "infinite-calendar.css"), gzipLimit: 2 * KIB },
  { label: "Datepicker JavaScript", path: resolve(distRoot, "datepicker.js"), gzipLimit: 10 * KIB },
  { label: "Datepicker CSS", path: resolve(distRoot, "datepicker.css"), gzipLimit: 3.5 * KIB },
  { label: "Date input JavaScript", path: resolve(distRoot, "date-input.js"), gzipLimit: 7 * KIB },
  { label: "Date input CSS", path: resolve(distRoot, "date-input.css"), gzipLimit: 1 * KIB },
  { label: "Date Parser JavaScript", path: resolve(distRoot, "date-parser.js"), gzipLimit: 6 * KIB }
];

function formatSize(bytes) {
  return `${bytes.toLocaleString("en-US")} B (${(bytes / KIB).toFixed(2)} KiB)`;
}

const missingBundles = bundles.filter((bundle) => !existsSync(bundle.path));
if (missingBundles.length) {
  for (const bundle of missingBundles) {
    console.error(`Missing ${bundle.label} bundle: ${relative(projectRoot, bundle.path)}`);
  }
  console.error("Build the library first with `npm run build:lib`.");
  process.exitCode = 1;
} else {
  const results = bundles.map((bundle) => {
    const source = readFileSync(bundle.path);
    return { ...bundle, rawSize: source.byteLength, gzipSize: gzipSync(source, { level: 9 }).byteLength };
  });

  for (const result of results) {
    console.log(
      `${result.label} ${relative(projectRoot, result.path)}: raw ${formatSize(result.rawSize)}, gzip ${formatSize(result.gzipSize)} / ${formatSize(result.gzipLimit)}`
    );
  }

  const failures = results.filter((result) => result.gzipSize > result.gzipLimit);
  if (failures.length) {
    for (const failure of failures) {
      console.error(`${failure.label} exceeds its gzip limit by ${formatSize(failure.gzipSize - failure.gzipLimit)}.`);
    }
    process.exitCode = 1;
  } else {
    console.log("Bundle size check passed.");
  }
}
