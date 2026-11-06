// Checks every recipe under recipes/<platform>/<name>/ and runs its tests.
// Run with `npm test`. Exits 1 if anything fails.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join, relative } from 'node:path';
import { check as themeCheck, Severity } from '@shopify/theme-check-node';

const ROOT = join(import.meta.dirname, '..');
const RECIPES = join(ROOT, 'recipes');
const REQUIRED_HEADINGS = ['## What it does', '## Where it goes', '## How to use', '## Tested'];
const TEXT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.liquid', '.md', '.mjs', '.php', '.txt', '.yml']);

const SECRET_PATTERNS = [
  /shp(at|ss|ca|pa)_[0-9a-fA-F]{20,}/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /github_pat_[A-Za-z0-9_]{30,}/,
  /AKIA[0-9A-Z]{16}/,
  /xox[bpas]-[0-9A-Za-z-]{10,}/,
  /BEGIN [A-Z ]*PRIVATE KEY/,
  /AIza[0-9A-Za-z_-]{35}/,
  /[\w.+-]+@gmail\.com/i,
];

const failures = [];
const fail = (where, message) => failures.push(`${relative(ROOT, where)}: ${message}`);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function recipeDirs() {
  if (!existsSync(RECIPES)) return [];
  return readdirSync(RECIPES).flatMap((platform) =>
    readdirSync(join(RECIPES, platform)).map((name) => join(RECIPES, platform, name)),
  );
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8' });
  if (result.error) return { ok: false, output: result.error.message };
  return { ok: result.status === 0, output: `${result.stdout}${result.stderr}`.trim() };
}

function checkStructure(dir, files) {
  const readme = join(dir, 'README.md');
  if (!existsSync(readme)) return fail(dir, 'missing README.md');
  const text = readFileSync(readme, 'utf8');
  for (const heading of REQUIRED_HEADINGS) {
    if (!text.includes(heading)) fail(readme, `missing "${heading}"`);
  }
  if (!basename(dir).startsWith('zg-')) fail(dir, 'recipe folder must start with zg-');
  if (!files.some((file) => /\.test\.(mjs|php)$/.test(file))) fail(dir, 'needs a *.test.mjs or *.test.php file');
}

function checkFile(file) {
  const extension = extname(file);
  if (extension === '.php') {
    const lint = run('php', ['-l', file]);
    if (!lint.ok) fail(file, lint.output);
  }
  if (extension === '.json') {
    try {
      JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
      fail(file, `invalid JSON: ${error.message}`);
    }
  }
  if (TEXT_EXTENSIONS.has(extension)) {
    const text = readFileSync(file, 'utf8');
    if (SECRET_PATTERNS.some((pattern) => pattern.test(text))) fail(file, 'looks like a secret or personal email');
  }
}

async function checkLiquid(files) {
  if (files.length === 0) return;
  const theme = mkdtempSync(join(tmpdir(), 'zg-theme-'));
  try {
    for (const folder of ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates']) {
      mkdirSync(join(theme, folder));
    }
    cpSync(join(ROOT, 'scripts', 'zg-theme-check.yml'), join(theme, '.theme-check.yml'));
    const source = new Map();
    for (const file of files) {
      const folder = readFileSync(file, 'utf8').includes('{% schema %}') ? 'sections' : 'snippets';
      const target = join(theme, folder, basename(file));
      cpSync(file, target);
      source.set(basename(file), file);
    }
    const offenses = await themeCheck(theme);
    for (const offense of offenses.filter((item) => item.severity === Severity.ERROR)) {
      const name = basename(offense.uri);
      fail(source.get(name) ?? join(ROOT, name), `${offense.check}: ${offense.message}`);
    }
  } finally {
    rmSync(theme, { recursive: true, force: true });
  }
}

function runTests(files) {
  for (const file of files) {
    const result = file.endsWith('.php') ? run('php', [file]) : run(process.execPath, ['--test', file]);
    if (!result.ok) fail(file, `tests failed\n${result.output}`);
    else console.log(`pass  ${relative(ROOT, file)}`);
  }
}

const dirs = recipeDirs();
const recipeFiles = dirs.flatMap((dir) => {
  const files = walk(dir);
  checkStructure(dir, files);
  return files;
});

recipeFiles.forEach(checkFile);
await checkLiquid(recipeFiles.filter((file) => extname(file) === '.liquid'));
runTests(recipeFiles.filter((file) => /\.test\.(mjs|php)$/.test(file)));

if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s):\n${failures.map((line) => `- ${line}`).join('\n')}`);
  process.exit(1);
}
console.log(`\n${dirs.length} recipe(s) OK`);
