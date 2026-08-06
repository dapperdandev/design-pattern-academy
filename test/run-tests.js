/**
 * Smoke tests — no framework, no dependencies: `node test/run-tests.js`.
 *
 * Covers the two things that can silently rot: the exercise definitions still
 * load and grade correctly, and extension.js still activates with every command
 * it declares in package.json. `vscode` is stubbed so this runs outside VS Code.
 */
'use strict';

const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert');

const ROOT = path.join(__dirname, '..');

// ---------------------------------------------------------------- vscode stub
const registered = [];
const Uri = {
  file: (p) => ({ fsPath: p, toString: () => 'file://' + p }),
  joinPath: (base, ...parts) => Uri.file(path.join(base.fsPath, ...parts))
};
const fakeVscode = {
  Uri,
  ViewColumn: { One: 1, Two: 2 },
  DiagnosticSeverity: { Error: 0, Warning: 1 },
  workspace: {
    workspaceFolders: [{ uri: Uri.file(path.join(ROOT, 'sandbox')) }],
    getConfiguration: () => ({ get: (_key, dflt) => dflt }),
    fs: { createDirectory: async () => {}, writeFile: async () => {}, stat: async () => ({}) },
    openTextDocument: async () => ({ getText: () => '' }),
    onDidSaveTextDocument: () => ({ dispose() {} })
  },
  window: {
    createWebviewPanel: () => ({
      webview: {
        cspSource: 'vscode-resource:',
        asWebviewUri: (u) => u,
        postMessage: () => {},
        onDidReceiveMessage: () => ({ dispose() {} }),
        html: ''
      },
      onDidDispose: () => ({ dispose() {} }),
      dispose: () => {}
    }),
    showTextDocument: async () => {},
    showErrorMessage: (m) => { throw new Error('unexpected error message: ' + m); },
    showInformationMessage: () => {},
    showWarningMessage: async () => undefined,
    showQuickPick: async () => undefined
  },
  languages: { getDiagnostics: () => [] },
  commands: {
    registerCommand: (id) => { registered.push(id); return { dispose() {} }; },
    executeCommand: () => {}
  }
};

const origLoad = Module._load;
Module._load = function (request) {
  if (request === 'vscode') return fakeVscode;
  return origLoad.apply(this, arguments);
};

// ---------------------------------------------------------------- harness
let failures = 0;
function test(name, fn) {
  try {
    fn();
    console.log('  PASS  ' + name);
  } catch (e) {
    failures++;
    console.log('  FAIL  ' + name + '\n        ' + e.message);
  }
}

const { runChecks } = require(path.join(ROOT, 'src/checker.js'));
const { panelHtml } = require(path.join(ROOT, 'src/panel.js'));
const extension = require(path.join(ROOT, 'extension.js'));
const pkg = require(path.join(ROOT, 'package.json'));

// ---------------------------------------------------------------- wiring
console.log('\n== wiring ==');

test('package.json declares exactly the commands extension.js registers', () => {
  extension.activate({ subscriptions: [], globalState: { get: (_k, d) => d, update() {} } });
  const declared = pkg.contributes.commands.map((c) => c.command).sort();
  assert.deepEqual(registered.slice().sort(), declared);
});

test('no dependencies and no build step', () => {
  assert.ok(!pkg.dependencies, 'dependencies should be absent');
  assert.equal(pkg.main, './extension.js');
});

test('every exercise loads and declares the required fields', () => {
  const exercises = extension.listExercises();
  assert.ok(exercises.length >= 1, 'expected at least one exercise');
  for (const { def } of exercises) {
    assert.ok(def.meta && def.meta.id, 'meta.id required');
    assert.equal(typeof def.scaffold, 'string', def.meta.id + ': scaffold must be a string');
    assert.ok(Array.isArray(def.steps) && def.steps.length, def.meta.id + ': needs steps');
    for (const step of def.steps) {
      assert.ok(step.title, def.meta.id + ': step needs a title');
      assert.ok(Array.isArray(step.checks) && step.checks.length,
        def.meta.id + ' / ' + step.title + ': needs at least one check');
      for (const check of step.checks) {
        assert.equal(typeof check.run, 'function', def.meta.id + ': check.run must be a function');
      }
    }
    for (const q of def.quiz || []) {
      assert.ok(q.options && q.options.length >= 2, def.meta.id + ': quiz needs options');
      assert.ok(q.answer >= 0 && q.answer < q.options.length, def.meta.id + ': quiz answer in range');
    }
  }
});

test('panel renders with a CSP nonce and no un-nonced script', () => {
  const { def } = extension.listExercises()[0];
  const panel = fakeVscode.window.createWebviewPanel();
  const html = panelHtml(panel.webview, ROOT, def, { quiz: [], steps: [] });
  assert.ok(html.includes('Content-Security-Policy'));
  assert.ok(/nonce-[A-Za-z0-9]{32}/.test(html));
  assert.ok(!html.includes('<script>'), 'inline scripts must carry a nonce');
});

// ---------------------------------------------------------------- grading
console.log('\n== grading: builder ==');
const def = require(path.join(ROOT, 'exercises/builder.js'));

const SOLUTION = `
type Bread = 'white' | 'wheat' | 'rye';
type Cheese = 'cheddar' | 'swiss';

class Sandwich {
  bread: Bread = 'white';
  decks = 1;
  cheese: Cheese | null = null;
  toppings: string[] = [];
  toasted = false;
}

interface SandwichBuilder {
  reset(): this;
  setBread(bread: Bread): this;
  addDeck(): this;
  setCheese(cheese: Cheese): this;
  addTopping(topping: string): this;
  toast(): this;
  build(): Sandwich;
}

class DeliSandwichBuilder implements SandwichBuilder {
  private sandwich = new Sandwich();
  reset(): this { this.sandwich = new Sandwich(); return this; }
  setBread(bread: Bread): this { this.sandwich.bread = bread; return this; }
  addDeck(): this { this.sandwich.decks += 1; return this; }
  setCheese(cheese: Cheese): this { this.sandwich.cheese = cheese; return this; }
  addTopping(topping: string): this { this.sandwich.toppings.push(topping); return this; }
  toast(): this { this.sandwich.toasted = true; return this; }
  build(): Sandwich { const order = this.sandwich; this.reset(); return order; }
}

class SandwichArtist {
  private builder: SandwichBuilder;
  constructor(builder: SandwichBuilder) { this.builder = builder; }
  makeGrilledCheese(): Sandwich {
    return this.builder.reset().setBread('white').setCheese('cheddar').toast().build();
  }
  makeClubSandwich(): Sandwich {
    return this.builder.reset().setBread('wheat').addDeck().setCheese('swiss')
      .addTopping('turkey').addTopping('bacon').toast().build();
  }
}

console.log(new Sandwich());
const builder = new DeliSandwichBuilder();
console.log(builder.setBread('rye').addDeck().addTopping('pastrami').build());
const artist = new SandwichArtist(builder);
console.log(artist.makeGrilledCheese());
console.log(artist.makeClubSandwich());
`;

test('the starting scaffold fails step 1 cleanly', () => {
  const r = runChecks(def, def.scaffold);
  assert.equal(r.fatal, false);
  assert.equal(r.steps[0].passed, false);
});

test('the reference solution passes every step and every check', () => {
  const r = runChecks(def, SOLUTION);
  assert.equal(r.error, null, 'unexpected error: ' + r.error);
  assert.equal(r.steps.filter((s) => s.passed).length, def.steps.length);
  const total = def.steps.reduce((n, s) => n + s.checks.length, 0);
  const green = r.steps.reduce((n, s) => n + s.checks.filter((c) => c.pass).length, 0);
  assert.equal(green, total, `expected ${total} green checks, got ${green}`);
});

test('logged output matches what `node` prints', () => {
  const r = runChecks(def, SOLUTION);
  assert.deepEqual(r.logs, [
    "Sandwich { bread: 'white', decks: 1, cheese: null, toppings: [], toasted: false }",
    "Sandwich { bread: 'rye', decks: 2, cheese: null, toppings: [ 'pastrami' ], toasted: false }",
    "Sandwich { bread: 'white', decks: 1, cheese: 'cheddar', toppings: [], toasted: true }",
    "Sandwich { bread: 'wheat', decks: 2, cheese: 'swiss', toppings: [ 'turkey', 'bacon' ], toasted: true }"
  ]);
});

test('a director that skips reset() is caught', () => {
  const r = runChecks(def, SOLUTION.replace(/\.reset\(\)\.setBread/g, '.setBread'));
  assert.equal(r.steps[3].passed, false);
  assert.match(r.steps[3].checks.at(-1).message, /decks should be 1 but was 2/);
});

test('field declaration order is not required', () => {
  const reordered = SOLUTION.replace(
    "  bread: Bread = 'white';\n  decks = 1;\n  cheese: Cheese | null = null;",
    "  bread: Bread = 'white';\n  cheese: Cheese | null = null;\n  decks = 1;"
  );
  assert.equal(runChecks(def, reordered).steps.filter((s) => s.passed).length, def.steps.length);
});

// ---------------------------------------------------------------- runtime limits
console.log('\n== runtime ==');

test('constructor parameter properties fail, as they do under node', () => {
  const r = runChecks(def, SOLUTION.replace(
    'private builder: SandwichBuilder;\n  constructor(builder: SandwichBuilder) { this.builder = builder; }',
    'constructor(private builder: SandwichBuilder) {}'
  ));
  assert.equal(r.fatal, true);
  assert.match(r.error, /parameter property is not supported/i);
});

test('a syntax error is fatal and reported', () => {
  const r = runChecks(def, "class Sandwich { cheese = 'none; }");
  assert.equal(r.fatal, true);
  assert.ok(r.error);
});

test('readonly still runs — proof that gating on VS Code type errors is required', () => {
  const r = runChecks(def, SOLUTION.replace('  bread: Bread', '  readonly bread: Bread'));
  assert.equal(r.fatal, false);
  assert.equal(r.steps.filter((s) => s.passed).length, def.steps.length,
    'behaviour is unaffected; only the type-check catches this');
});

test('an endless loop is stopped instead of hanging the extension host', () => {
  const r = runChecks(def, 'while (true) {}');
  assert.equal(r.fatal, true);
  assert.match(r.error, /more than 5 seconds/);
});

Module._load = origLoad;
console.log(failures ? `\n${failures} FAILURE(S)\n` : `\nAll tests passed.\n`);
process.exitCode = failures ? 1 : 0;
