import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import process from "node:process";

const root = resolve(".");
const writeHeaders = process.argv.includes("--write");
const domainNames = ["foundation", "scroll", "events", "anchors", "interactions", "rendering", "views"];
const runtimeDomains = new Set(domainNames.filter((domain) => domain !== "foundation"));
const retiredDirectories = [
  "components",
  "data",
  "hooks",
  "interaction",
  "styles",
  "utils",
  "viewport",
  "virtualization"
];
const allowedDependencies = {
  foundation: new Set(["foundation"]),
  scroll: new Set(["foundation", "scroll"]),
  events: new Set(["foundation", "events"]),
  interactions: new Set(["foundation", "interactions"]),
  anchors: new Set(["foundation", "scroll", "events", "interactions", "anchors"]),
  rendering: new Set(["foundation", "scroll", "events", "interactions", "anchors", "rendering"]),
  views: new Set(domainNames)
};
const headerPolicy = {
  foundation: {
    preserves: "the public compatibility boundary and deterministic cross-domain primitives",
    excludes: "runtime feature coordination",
    failure: "invalid inputs are normalized or rejected by the documented public contract"
  },
  scroll: {
    preserves: "the visible date and local pixel offset across bounded-window maintenance",
    excludes: "event fetching and semantic layout-focus policy",
    failure: "missing geometry retains the newest valid snapshot for the next settled pass"
  },
  events: {
    preserves: "non-blocking rendering, request-generation safety, and deterministic layout",
    excludes: "scroll writes and DOM projection",
    failure: "obsolete, aborted, or failed requests cannot replace a newer committed snapshot"
  },
  anchors: {
    preserves: "the current semantic calendar location across geometry changes",
    excludes: "browser DOM focus and gesture recognition",
    failure: "unresolved targets retry, fall back, or yield according to anchor priority"
  },
  interactions: {
    preserves: "mounted-grid hit testing and controlled parent ownership",
    excludes: "product rendering and direct settings mutation",
    failure: "cancelled or invalid gestures clear transient state without committing"
  },
  rendering: {
    preserves: "stable geometry, layering, clipping, and external renderer isolation",
    excludes: "requests, controlled settings, and scroll correction",
    failure: "missing optional content leaves structural calendar geometry intact"
  },
  views: {
    preserves: "public horizontal and vertical behavior while composing feature domains",
    excludes: "feature-domain algorithms",
    failure: "domain cancellation and fallback policies pass through without view-specific overrides"
  }
};

function filesBelow(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

function projectPath(path) {
  return relative(root, path).split(sep).join("/");
}

function sourceDomain(path) {
  const relativePath = projectPath(path);
  const match = relativePath.match(/^src\/lib\/infinite\/([^/]+)\//);
  if (match && runtimeDomains.has(match[1])) return match[1];
  if (/^src\/lib\/(?:index\.ts|core\/|data\/|date\/|time\/)/.test(relativePath)) return "foundation";
  return null;
}

function documentedSources(domain) {
  const docPath = resolve(root, `docs/domains/${domain}.md`);
  const text = readFileSync(docPath, "utf8");
  const sources = new Map();
  const rowPattern = /^\|\s+\[`[^`]+`\]\(\.\.\/\.\.\/(src\/lib\/[^)]+)\)\s+\|\s+(.+?)\s+\|$/gm;
  for (const match of text.matchAll(rowPattern)) sources.set(match[1], match[2].trim());
  return sources;
}

function headerFor(domain, responsibility) {
  const policy = headerPolicy[domain];
  return `/**\n * Domain: ${domain[0].toUpperCase()}${domain.slice(1)}.\n * Responsibility: ${responsibility}\n * Preserves: ${policy.preserves}.\n * Does not own: ${policy.excludes}.\n * Failure/cancellation: ${policy.failure}.\n *\n * @see docs/domains/${domain}.md#source-map\n */\n`;
}

const sourceFiles = filesBelow(resolve(root, "src/lib"))
  .filter((path) => /\.(?:ts|tsx|css)$/.test(path) && !path.endsWith(".d.ts"))
  .sort();
const docMaps = new Map(domainNames.map((domain) => [domain, documentedSources(domain)]));
const failures = [];

for (const sourceFile of sourceFiles) {
  const path = projectPath(sourceFile);
  const domain = sourceDomain(sourceFile);
  if (!domain) {
    failures.push(`${path}: no responsibility domain`);
    continue;
  }
  const responsibility = docMaps.get(domain).get(path);
  if (!responsibility) {
    failures.push(`${path}: missing from docs/domains/${domain}.md source map`);
    continue;
  }
  const expectedLink = `@see docs/domains/${domain}.md#source-map`;
  const input = readFileSync(sourceFile, "utf8");
  if (writeHeaders && !input.includes(expectedLink)) {
    writeFileSync(sourceFile, `${headerFor(domain, responsibility)}${input}`);
  } else if (!writeHeaders) {
    const links = input.match(/@see docs\/domains\/[^\s*]+/g) ?? [];
    if (links.length !== 1 || links[0] !== expectedLink) {
      failures.push(`${path}: expected exactly one ${expectedLink} backlink`);
    }
  }
}

for (const [domain, sources] of docMaps) {
  for (const sourcePath of sources.keys()) {
    const absolutePath = resolve(root, sourcePath);
    if (!existsSync(absolutePath)) failures.push(`docs/domains/${domain}.md: missing source ${sourcePath}`);
    else if (sourceDomain(absolutePath) !== domain) {
      failures.push(`docs/domains/${domain}.md: ${sourcePath} belongs to ${sourceDomain(absolutePath)}`);
    }
  }
}

function resolveSourceImport(sourceFile, specifier) {
  const base = resolve(dirname(sourceFile), specifier);
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find(existsSync);
}

for (const sourceFile of sourceFiles.filter((path) => /\.(?:ts|tsx)$/.test(path))) {
  const fromDomain = sourceDomain(sourceFile);
  const text = readFileSync(sourceFile, "utf8");
  for (const match of text.matchAll(/["'](\.\.?\/[^"']+)["']/g)) {
    const target = resolveSourceImport(sourceFile, match[1]);
    if (!target) continue;
    const toDomain = sourceDomain(target);
    if (!toDomain || allowedDependencies[fromDomain].has(toDomain)) continue;
    const calendarRootException = projectPath(sourceFile) === "src/lib/core/CalendarRoot.tsx" && toDomain === "views";
    if (!calendarRootException) {
      failures.push(`${projectPath(sourceFile)}: ${fromDomain} cannot import ${toDomain} (${projectPath(target)})`);
    }
  }
}

for (const directory of retiredDirectories) {
  const path = resolve(root, `src/lib/infinite/${directory}`);
  if (existsSync(path)) failures.push(`Retired catch-all directory still exists: src/lib/infinite/${directory}`);
}

if (failures.length) {
  for (const failure of failures) console.error(failure);
  console.error(`Domain documentation check failed with ${failures.length} problem(s).`);
  process.exitCode = 1;
} else {
  console.log(
    `Domain documentation check passed for ${sourceFiles.length} source files across ${domainNames.length} domains.`
  );
}
