import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import process from "node:process";
import ts from "typescript";

const MODULE_LINE_LIMIT = 200;
const FUNCTION_LINE_LIMIT = 120;
const projectRoot = resolve(".");
const sourceRoot = resolve(process.argv[2] ?? "src/lib");

function productionTypeScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? productionTypeScriptFiles(path) : [path];
    })
    .filter((path) => /\.(?:ts|tsx)$/.test(path))
    .filter((path) => !/\.d\.ts$|\.(?:test|spec)\.(?:ts|tsx)$|[/\\]__tests__[/\\]/.test(path))
    .sort();
}

function sourceFileFor(path, sourceText) {
  const scriptKind = path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(path, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
}

function nonCommentLineCount(sourceFile, sourceText) {
  const codeLines = new Set();
  const languageVariant = sourceFile.languageVariant ?? ts.LanguageVariant.Standard;
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, languageVariant, sourceText);

  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    const start = scanner.getTokenPos();
    const end = Math.max(start, scanner.getTextPos() - 1);
    const startLine = sourceFile.getLineAndCharacterOfPosition(start).line;
    const endLine = sourceFile.getLineAndCharacterOfPosition(end).line;
    for (let line = startLine; line <= endLine; line += 1) codeLines.add(line);
  }
  return codeLines.size;
}

function isFunctionNode(node) {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isConstructorDeclaration(node)
  );
}

function functionName(node, sourceFile) {
  if (node.name) return node.name.getText(sourceFile);
  if (ts.isVariableDeclaration(node.parent)) return node.parent.name.getText(sourceFile);
  if (ts.isPropertyAssignment(node.parent)) return node.parent.name.getText(sourceFile);
  if (ts.isCallExpression(node.parent)) {
    const callbackIndex = node.parent.arguments.indexOf(node) + 1;
    return `${node.parent.expression.getText(sourceFile)} callback #${callbackIndex}`;
  }
  return ts.SyntaxKind[node.kind];
}

function functionViolations(sourceFile) {
  const violations = [];
  const visit = (node) => {
    if (isFunctionNode(node)) {
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
      const end =
        sourceFile.getLineAndCharacterOfPosition(Math.max(node.getStart(sourceFile), node.getEnd() - 1)).line + 1;
      const lineCount = end - start + 1;
      if (lineCount > FUNCTION_LINE_LIMIT) {
        violations.push({ start, end, lineCount, name: functionName(node, sourceFile) });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return violations;
}

function displayPath(path) {
  const pathFromProject = relative(projectRoot, path);
  return pathFromProject.startsWith("..") ? path : pathFromProject;
}

const files = productionTypeScriptFiles(sourceRoot);
const moduleFailures = [];
const functionFailures = [];

for (const path of files) {
  const sourceText = readFileSync(path, "utf8");
  const sourceFile = sourceFileFor(path, sourceText);
  const moduleLines = nonCommentLineCount(sourceFile, sourceText);
  if (moduleLines > MODULE_LINE_LIMIT) moduleFailures.push({ path, lineCount: moduleLines });
  for (const violation of functionViolations(sourceFile)) functionFailures.push({ path, ...violation });
}

for (const failure of moduleFailures) {
  console.error(
    `${displayPath(failure.path)}: ${failure.lineCount} non-comment lines (module limit: ${MODULE_LINE_LIMIT})`
  );
}
for (const failure of functionFailures) {
  console.error(
    `${displayPath(failure.path)}:${failure.start}-${failure.end}: ${failure.name} spans ${failure.lineCount} source lines (function limit: ${FUNCTION_LINE_LIMIT})`
  );
}

if (moduleFailures.length || functionFailures.length) {
  console.error(
    `Architecture check failed: ${moduleFailures.length} module violation(s), ${functionFailures.length} function violation(s).`
  );
  process.exitCode = 1;
} else {
  console.log(
    `Architecture check passed for ${files.length} production modules (modules <= ${MODULE_LINE_LIMIT} non-comment lines; functions <= ${FUNCTION_LINE_LIMIT} source lines).`
  );
}
