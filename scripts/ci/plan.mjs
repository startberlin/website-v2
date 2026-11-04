import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, extname, resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const testPattern = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const ignored = /^(?:dist|first-draft|design\/handoff|docs\/verification|node_modules|\.astro|\.vercel)\//;
const codePattern = /\.[cm]?[jt]sx?$|\.astro$/;
const globalInputs = /^(?:package(?:-lock)?\.json|pnpm-(?:lock\.yaml|workspace\.yaml)|astro\.config\..+|tsconfig(?:\..+)?\.json|\.env\.example)$/;
const appInput = file => /^(?:src|public)\//.test(file) || globalInputs.test(file);
const canonicalNodeTest = command => /^node(?: --import tsx)? --test(?: [\w./*?\[\]-]+)?$/.test(command);

export function sourceFiles(root) {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(file => file && !ignored.test(file));
}

export function affectedTests(root, files, changed, full = false, nativeOnly = false) {
  const tests = files.filter(file => testPattern.test(file));
  const known = new Set(files);
  const changedSet = new Set(changed);
  const cache = new Map();
  const configPath = resolve(root, 'tsconfig.json');
  const parsed = existsSync(configPath) ? ts.readConfigFile(configPath, ts.sys.readFile) : { config: {} };
  const options = ts.parseJsonConfigFileContent(parsed.config || {}, ts.sys, root).options;
  function dependencies(file) {
    if (cache.has(file)) return cache.get(file);
    const output = { files: [], uncertain: false, native: false };
    cache.set(file, output);
    const path = resolve(root, file);
    if (!existsSync(path) || !codePattern.test(file)) return output;
    let source = readFileSync(path, 'utf8');
    if (extname(file) === '.astro') source = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] || '';
    for (const imported of ts.preProcessFile(source, true, true).importedFiles) {
      const specifier = imported.fileName;
      if (specifier === 'node:test') output.native = true;
      const resolved = ts.resolveModuleName(specifier, path, options, ts.sys).resolvedModule?.resolvedFileName;
      const candidates = [resolved, ...(specifier.startsWith('.') ? ['', '.ts', '.tsx', '.js', '.mjs', '.astro', '.json', '/index.ts', '/index.js'].map(extension => resolve(dirname(path), specifier + extension)) : [])].filter(Boolean);
      const local = candidates.map(candidate => relative(root, candidate).replaceAll('\\', '/')).find(candidate => known.has(candidate));
      if (local) output.files.push(local);
      else if (specifier.startsWith('.') || specifier.startsWith('@/')) output.uncertain = true;
    }
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const visit = node => {
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require')) && !ts.isStringLiteralLike(node.arguments[0] || {})) output.uncertain = true;
      ts.forEachChild(node, visit);
    };
    visit(ast);
    return output;
  }
  function touchesChanged(file, visited = new Set()) {
    if (changedSet.has(file)) return true;
    if (visited.has(file)) return false;
    visited.add(file);
    const data = dependencies(file);
    return data.uncertain || data.files.some(dependency => touchesChanged(dependency, visited));
  }
  function isNative(file, visited = new Set()) {
    if (visited.has(file)) return false;
    visited.add(file);
    const data = dependencies(file);
    return data.native || data.uncertain || data.files.some(dependency => isNative(dependency, visited));
  }
  // Pipeline policy and its guards are coupled through the workflow, not ordinary imports.
  const pipeline = changed.some(file => file.startsWith('.github/') || file.startsWith('scripts/ci/'));
  return tests.filter(test => (!nativeOnly || isNative(test)) && (full || (pipeline && test.startsWith('scripts/')) || touchesChanged(test))).sort();
}

export function createPlan(root, changed, { full = false, removed = false } = {}) {
  const files = sourceFiles(root);
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const global = full || removed || changed.some(file => globalInputs.test(file));
  const app = global || changed.some(appInput);
  const logic = global || changed.some(file => codePattern.test(file) || /\.json$/.test(file));
  const quality = app ? Object.keys(pkg.scripts || {}).filter(name => name === 'typecheck' || name.startsWith('check:')).sort() : [];
  const customCandidates = Object.entries(pkg.scripts || {}).filter(([name, command]) => name.startsWith('test:') && !canonicalNodeTest(command));
  const nativeTests = affectedTests(root, files, changed, global, customCandidates.length > 0);
  // Unfamiliar/new test runners are opted in by their script, with a conservative scope.
  const customTests = (app || logic) ? customCandidates.map(([name]) => name).sort() : [];
  const workflows = global || changed.some(file => /^\.github\/(?:workflows|actions)\//.test(file));
  return { changed, quality, nativeTests, customTests, build: app, workflows, tests: nativeTests.length > 0 || customTests.length > 0 };
}

export function changedFiles(root, base, head) {
  if (!base || /^0+$/.test(base) || !head) return { changed: [], full: true };
  const output = execFileSync('git', ['diff', '--name-status', '-z', base, head], { cwd: root, encoding: 'utf8' }).split('\0');
  const changed = [];
  let removed = false;
  for (let index = 0; index < output.length && output[index];) {
    const status = output[index++];
    const path = output[index++];
    changed.push(path);
    if (/^[RC]/.test(status)) changed.push(output[index++]);
    if (/^[DR]/.test(status) && !/\.md$/.test(path)) removed = true;
  }
  return { changed, full: false, removed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.cwd();
  const selection = (process.argv.includes('--all') || process.env.CI_FORCE_ALL === 'true') ? { changed: [], full: true } : changedFiles(root, process.env.CI_BASE_SHA, process.env.CI_HEAD_SHA);
  const plan = createPlan(root, selection.changed, selection);
  console.log(JSON.stringify(plan, null, 2));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `plan=${JSON.stringify(plan)}\nquality=${plan.quality.length > 0}\ntests=${plan.tests}\nbuild=${plan.build}\nworkflows=${plan.workflows}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Selected verification\n\nChecks: ${plan.quality.join(', ') || 'none needed'}\n\nNative tests: ${plan.nativeTests.join(', ') || 'none affected'}\n\nOther test runners: ${plan.customTests.join(', ') || 'none'}\n\nBuilds: ${plan.build ? 'Node and Vercel' : 'not needed'}\n\nWorkflow validation: ${plan.workflows ? 'required' : 'not needed'}\n`);
}
