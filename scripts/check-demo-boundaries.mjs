import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(".");
const failures = [];
const allowedSourceEntries = new Set(["lib"]);
const recipeComponents = {
  "integration-walkthrough": {
    component: "IntegrationWalkthrough.tsx",
    publicEntry: "ArticleDemos.tsx"
  }
};

for (const entry of readdirSync(resolve(root, "src"), { withFileTypes: true })) {
  if (entry.name.startsWith(".")) continue;
  if (!allowedSourceEntries.has(entry.name))
    failures.push(`src/${entry.name}: src must contain reusable library code only`);
}

for (const [directory, recipe] of Object.entries(recipeComponents)) {
  const { component: componentName, publicEntry = componentName } = recipe;
  const recipeRoot = resolve(root, "demo/examples", directory);
  const readme = resolve(recipeRoot, "README.md");
  const component = resolve(recipeRoot, componentName);
  if (!existsSync(readme)) failures.push(`demo/examples/${directory}: missing README.md`);
  if (!existsSync(component)) {
    failures.push(`demo/examples/${directory}: missing ${componentName}`);
    continue;
  }
  const source = readFileSync(component, "utf8");
  const publicSourcePath = resolve(recipeRoot, publicEntry);
  if (!existsSync(publicSourcePath)) {
    failures.push(`demo/examples/${directory}: missing ${publicEntry}`);
    continue;
  }
  const publicSource = readFileSync(publicSourcePath, "utf8");
  if (!source.includes("@see ./README.md"))
    failures.push(`demo/examples/${directory}/${componentName}: missing README backlink`);
  if (!publicSource.includes('from "quno-calendar"'))
    failures.push(`demo/examples/${directory}/${publicEntry}: use the public package import`);
  if (/src\/lib|\.\.\/lib/.test(source) || /src\/lib|\.\.\/lib/.test(publicSource))
    failures.push(`demo/examples/${directory}: imports library internals`);
}

if (failures.length) {
  for (const failure of failures) console.error(failure);
  console.error(`Demo boundary check failed with ${failures.length} problem(s).`);
  process.exitCode = 1;
} else {
  console.log("Demo boundary check passed for the editorial walkthrough.");
}
