import { realpathSync } from "node:fs";
import { resolve, relative } from "node:path";
import ts from "typescript";

const root = resolve(".");
const libraryRoot = realpathSync(resolve(process.argv[2] ?? "src/lib"));
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const options = { ...parsed.options, paths: { ...parsed.options.paths, "#quno-internal/*": [`${libraryRoot}/*`] } };
const sourceFiles = process.argv[2]
  ? ts.sys.readDirectory(libraryRoot, [".ts", ".tsx"], [], ["**/*"])
  : parsed.fileNames;
const program = ts.createProgram(sourceFiles, options);
const checker = program.getTypeChecker();
const failures = [];
const isLibraryNode = (node) => node?.getSourceFile().fileName.startsWith(`${libraryRoot}/`);
const signatures = (type) =>
  type ? checker.getSignaturesOfType(checker.getNonNullableType(type), ts.SignatureKind.Call) : [];

function contextualType(node) {
  return ts.isExpression(node) ? checker.getContextualType(node) : undefined;
}

function acceptsNamedObject(type) {
  if (type.isUnion())
    return type.types.every((part) => Boolean(part.flags & ts.TypeFlags.Undefined) || acceptsNamedObject(part));
  if (!(type.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection))) return false;
  const name = checker.typeToString(type).split("<")[0];
  return (
    !checker.isArrayType(type) &&
    !checker.isTupleType(type) &&
    signatures(type).length === 0 &&
    !["Date", "Map", "ReadonlyMap", "Set", "ReadonlySet", "RegExp", "Intl.DateTimeFormat"].includes(name)
  );
}

function hasExternalSignature(node) {
  const contextual = signatures(contextualType(node));
  if (contextual.length && contextual.every((signature) => !isLibraryNode(signature.declaration))) return true;
  const parent = node.parent;
  if (!ts.isCallExpression(parent)) return false;
  // Hook callbacks remain library-owned; native iteration, promises, DOM and
  // framework lifecycle/ref callbacks keep the signatures imposed by their host.
  if (["useCallback", "useMemo", "useImperativeHandle"].includes(parent.expression.getText())) return false;
  return !isLibraryNode(checker.getResolvedSignature(parent)?.declaration);
}

function report(node, message) {
  const source = node.getSourceFile();
  const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  failures.push(`${relative(root, source.fileName)}:${line}: ${message}`);
}

const allowedDomains = {
  shared: new Set(["shared"]),
  "date-parser": new Set(["shared", "date-parser"]),
  "date-input": new Set(["shared", "date-parser", "date-input"]),
  "date-picker": new Set(["shared", "date-picker"]),
  timeline: new Set(["shared", "timeline"])
};

function checkDependency(node, domain) {
  const specifier = node.moduleSpecifier;
  if (!specifier || !ts.isStringLiteral(specifier)) return;
  const resolved = ts.resolveModuleName(specifier.text, node.getSourceFile().fileName, options, ts.sys).resolvedModule;
  if (resolved?.resolvedFileName.startsWith(`${libraryRoot}/`)) {
    const targetDomain = relative(libraryRoot, resolved.resolvedFileName).split("/")[0];
    if (allowedDomains[domain] && !allowedDomains[domain].has(targetDomain))
      report(node, `${domain} must not depend on ${targetDomain}.`);
  }
  if (
    ["shared", "date-parser"].includes(domain) &&
    !specifier.text.startsWith(".") &&
    !specifier.text.startsWith("#quno-internal/")
  ) {
    report(node, `${domain} must remain headless and dependency-free, including its types.`);
  }
}

for (const source of program.getSourceFiles().filter(isLibraryNode)) {
  const domain = relative(libraryRoot, source.fileName).split("/")[0];
  function visit(node) {
    if (ts.isFunctionLike(node) && node.parameters.length && !hasExternalSignature(node)) {
      if (
        node.parameters.length !== 1 ||
        node.parameters[0].dotDotDotToken ||
        !acceptsNamedObject(checker.getTypeAtLocation(node.parameters[0]))
      ) {
        report(
          node,
          "Library functions accept one named object; use an explicitly typed adapter for native callbacks."
        );
      }
    }
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) checkDependency(node, domain);
    ts.forEachChild(node, visit);
  }
  visit(source);
}

if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exitCode = 1;
} else {
  console.log(
    "Library contracts passed: named object arguments, explicit native callback boundaries, and product dependency direction."
  );
}
