import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(".");
const failures = [];
const allowedSourceEntries = new Set(["lib"]);
const recipeComponents = {
  "read-only": "ReadOnlyCalendar.tsx",
  "drag-create": "DragCreateCalendar.tsx",
  "vertical-planner": "VerticalPlanner.tsx",
  availability: "AvailabilityEditor.tsx",
  "controlled-draft": "ControlledDraftCalendar.tsx",
  "async-api": "AsyncApiCalendar.tsx"
};

for (const entry of readdirSync(resolve(root, "src"), { withFileTypes: true })) {
  if (entry.name.startsWith(".")) continue;
  if (!allowedSourceEntries.has(entry.name))
    failures.push(`src/${entry.name}: src must contain reusable library code only`);
}

for (const [directory, componentName] of Object.entries(recipeComponents)) {
  const recipeRoot = resolve(root, "demo/examples", directory);
  const readme = resolve(recipeRoot, "README.md");
  const component = resolve(recipeRoot, componentName);
  if (!existsSync(readme)) failures.push(`demo/examples/${directory}: missing README.md`);
  if (!existsSync(component)) {
    failures.push(`demo/examples/${directory}: missing ${componentName}`);
    continue;
  }
  const source = readFileSync(component, "utf8");
  if (!source.includes("@see ./README.md"))
    failures.push(`demo/examples/${directory}/${componentName}: missing README backlink`);
  if (!source.includes('from "quno-calendar"'))
    failures.push(`demo/examples/${directory}/${componentName}: use the public package import`);
  if (/src\/lib|\.\.\/lib/.test(source))
    failures.push(`demo/examples/${directory}/${componentName}: imports library internals`);
}

if (failures.length) {
  for (const failure of failures) console.error(failure);
  console.error(`Demo boundary check failed with ${failures.length} problem(s).`);
  process.exitCode = 1;
} else {
  console.log(`Demo boundary check passed for ${Object.keys(recipeComponents).length} documented recipes.`);
}
