/**
 * Smoke tests — no framework, no dependencies: `node test/run-tests.js`.
 *
 * Covers the two things that can silently rot: the exercise definitions still
 * load and grade correctly, and extension.js still activates with every command
 * it declares in package.json. `vscode` is stubbed so this runs outside VS Code.
 */
'use strict';

const fs = require('node:fs');
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
const treeProviders = {};
const fakeVscode = {
  Uri,
  ViewColumn: { One: 1, Two: 2 },
  DiagnosticSeverity: { Error: 0, Warning: 1 },
  TreeItem: class {
    constructor(label, collapsibleState) {
      this.label = label;
      this.collapsibleState = collapsibleState;
    }
  },
  TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
  ThemeIcon: class { constructor(id, color) { this.id = id; this.color = color; } },
  ThemeColor: class { constructor(id) { this.id = id; } },
  EventEmitter: class {
    constructor() { this.event = () => ({ dispose() {} }); }
    fire() {}
    dispose() {}
  },
  workspace: {
    workspaceFolders: [{ uri: Uri.file(path.join(ROOT, 'sandbox')) }],
    getConfiguration: () => ({ get: (_key, dflt) => dflt }),
    fs: {
      createDirectory: async () => {},
      writeFile: async () => {},
      stat: async () => ({}),
      readFile: async () => { throw new Error('ENOENT'); } // no file yet, by default
    },
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
    showQuickPick: async () => undefined,
    registerTreeDataProvider: (id, provider) => {
      treeProviders[id] = provider;
      return { dispose() {} };
    }
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
// Tests are queued and run at the end so async tests (scaffolding) are awaited
// like everything else.
let failures = 0;
const queue = [];
function section(title) { queue.push({ title }); }
function test(name, fn) { queue.push({ name, fn }); }

const { runChecks } = require(path.join(ROOT, 'src/checker.js'));
const { panelHtml } = require(path.join(ROOT, 'src/panel.js'));
const extension = require(path.join(ROOT, 'extension.js'));
const pkg = require(path.join(ROOT, 'package.json'));

// ---------------------------------------------------------------- wiring
section('== wiring ==');

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

test('sidebar tree lists exercises with progress and reference sheets', () => {
  const provider = treeProviders['designPatternAcademy.exercises'];
  assert.ok(provider, 'tree provider should be registered at activation');
  const roots = provider.getChildren();
  const builder = roots.find((r) => String(r.label).includes('The Builder Pattern'));
  assert.ok(builder, 'builder exercise appears in the tree');
  assert.deepEqual(builder.command.arguments, ['builder'], 'clicking opens that exercise directly');
  assert.match(String(builder.description), /^0\/5$/, 'four build steps plus the quiz');
  const refRoot = roots.find((r) => r.contextValue === 'dpa.referenceRoot');
  assert.ok(refRoot, 'reference sheets node exists');
  const refs = provider.getChildren(refRoot);
  assert.ok(refs.some((r) => r.command.arguments[0] === 'builder-pattern.md'));
  assert.ok(refs.some((r) => r.command.arguments[0] === 'strategy-pattern.md'));
  assert.ok(refs.some((r) => r.command.arguments[0] === 'factory-method-pattern.md'));
  assert.ok(refs.some((r) => r.command.arguments[0] === 'design-patterns-glossary.md'));
});

test('exercises are listed in meta.number order', () => {
  assert.deepEqual(extension.listExercises().map((e) => e.id),
    ['builder', 'strategy', 'factory-method']);
});

test('every exercise has a reference sheet of its own', () => {
  for (const { def } of extension.listExercises()) {
    const sheets = (def.meta.references || []).filter((r) => r.name);
    for (const sheet of sheets) {
      assert.ok(fs.existsSync(path.join(ROOT, 'reference', sheet.name)),
        def.meta.id + ': missing reference/' + sheet.name);
    }
    assert.ok(sheets.some((r) => r.name === def.meta.id + '-pattern.md'),
      def.meta.id + ': should link its own cheat sheet');
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

// ---------------------------------------------------------------- scaffolding
section('== scaffolding ==');
const def = require(path.join(ROOT, 'exercises/builder.js'));

test('code in per-pattern subfolders, one shared config pair at the root', async () => {
  const root = fakeVscode.workspace.workspaceFolders[0].uri.fsPath;
  const uris = await extension.scaffold(def);
  assert.equal(uris.file.fsPath, path.join(root, 'builder', 'builder.ts'),
    'exercise code gets its own folder');
  assert.equal(uris.tsconfig.fsPath, path.join(root, 'tsconfig.json'),
    'ONE tsconfig at the root covers every exercise');
  assert.equal(uris.globals.fsPath, path.join(root, 'dpa-globals.d.ts'));
});

test('a tsconfig the user owns is never overwritten', async () => {
  const written = [];
  const origWrite = fakeVscode.workspace.fs.writeFile;
  const origRead = fakeVscode.workspace.fs.readFile;
  fakeVscode.workspace.fs.writeFile = async (uri) => { written.push(path.basename(uri.fsPath)); };
  fakeVscode.workspace.fs.readFile = async () =>
    Buffer.from('{ "compilerOptions": { "strict": false } }'); // theirs — no marker
  try {
    await extension.scaffold(def);
    assert.ok(!written.includes('tsconfig.json'), 'must not clobber a user-owned tsconfig');
    assert.ok(!written.includes('dpa-globals.d.ts'), 'same rule for the globals file');
  } finally {
    fakeVscode.workspace.fs.writeFile = origWrite;
    fakeVscode.workspace.fs.readFile = origRead;
  }
});

// ---------------------------------------------------------------- grading
section('== grading: builder ==');

const SOLUTION = `
type Bread = 'white' | 'wheat' | 'rye';
type Cheese = 'cheddar' | 'swiss';

class Sandwich {
  bread: Bread = 'white';
  cheese: Cheese | null = null;
  toppings: string[] = [];
  toasted = false;
}

interface SandwichBuilder {
  reset(): this;
  setBread(bread: Bread): this;
  setCheese(cheese: Cheese): this;
  addTopping(topping: string): this;
  toast(): this;
  build(): Sandwich;
}

class DeliSandwichBuilder implements SandwichBuilder {
  private sandwich = new Sandwich();
  reset(): this { this.sandwich = new Sandwich(); return this; }
  setBread(bread: Bread): this { this.sandwich.bread = bread; return this; }
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
    return this.builder.reset().setBread('wheat').setCheese('swiss')
      .addTopping('turkey').addTopping('bacon').toast().build();
  }
}

console.log(new Sandwich());
const builder = new DeliSandwichBuilder();
console.log(builder.setBread('rye').addTopping('pastrami').build());
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
    "Sandwich { bread: 'white', cheese: null, toppings: [], toasted: false }",
    "Sandwich { bread: 'rye', cheese: null, toppings: [ 'pastrami' ], toasted: false }",
    "Sandwich { bread: 'white', cheese: 'cheddar', toppings: [], toasted: true }",
    "Sandwich { bread: 'wheat', cheese: 'swiss', toppings: [ 'turkey', 'bacon' ], toasted: true }"
  ]);
});

test('a director that skips reset() is caught', () => {
  const r = runChecks(def, SOLUTION.replace(/\.reset\(\)\.setBread/g, '.setBread'));
  assert.equal(r.steps[3].passed, false);
  const failed = r.steps[3].checks.find((c) => !c.pass);
  assert.ok(failed, 'a director check should have failed');
  assert.match(failed.message, /toppings should be \(none\) but were pastrami/,
    'the mid-order pastrami leaks into the recipe when reset() is missing');
});

test('field declaration order is not required', () => {
  const reordered = SOLUTION.replace(
    "  bread: Bread = 'white';\n  cheese: Cheese | null = null;",
    "  cheese: Cheese | null = null;\n  bread: Bread = 'white';"
  );
  assert.equal(runChecks(def, reordered).steps.filter((s) => s.passed).length, def.steps.length);
});

// ---------------------------------------------------------------- grading: strategy
section('== grading: strategy ==');

const strategyDef = require(path.join(ROOT, 'exercises/strategy.js'));

const STRATEGY_SOLUTION = `
type Parcel = {
  weightKg: number;
  distanceKm: number;
};

interface ShippingStrategy {
  quote(parcel: Parcel): number;
}

class StandardShipping implements ShippingStrategy {
  quote(parcel: Parcel): number {
    return 5 + 2 * parcel.weightKg;
  }
}

class OvernightShipping implements ShippingStrategy {
  quote(parcel: Parcel): number {
    const longHaul = parcel.distanceKm > 100 ? 25 : 0;
    return 12 + 3 * parcel.weightKg + longHaul;
  }
}

class Checkout {
  private strategy: ShippingStrategy;

  constructor(strategy: ShippingStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: ShippingStrategy): void {
    this.strategy = strategy;
  }

  quote(parcel: Parcel): number {
    return this.strategy.quote(parcel);
  }
}

type QuoteFn = (parcel: Parcel) => number;

function asStrategy(quote: QuoteFn): ShippingStrategy {
  return { quote };
}

const books: Parcel = { weightKg: 2, distanceKm: 50 };
const desk: Parcel = { weightKg: 10, distanceKm: 400 };

const checkout = new Checkout(new StandardShipping());
console.log(checkout.quote(books));
console.log(checkout.quote(desk));

checkout.setStrategy(new OvernightShipping());
console.log(checkout.quote(books));
console.log(checkout.quote(desk));

checkout.setStrategy(asStrategy(() => 0));
console.log(checkout.quote(desk));
`;

test('strategy: the starting scaffold fails step 1 cleanly', () => {
  const r = runChecks(strategyDef, strategyDef.scaffold);
  assert.equal(r.fatal, false);
  assert.equal(r.steps[0].passed, false);
});

test('strategy: the reference solution passes every step and every check', () => {
  const r = runChecks(strategyDef, STRATEGY_SOLUTION);
  assert.equal(r.error, null, 'unexpected error: ' + r.error);
  assert.equal(r.steps.filter((s) => s.passed).length, strategyDef.steps.length);
  const total = strategyDef.steps.reduce((n, s) => n + s.checks.length, 0);
  const green = r.steps.reduce((n, s) => n + s.checks.filter((c) => c.pass).length, 0);
  assert.equal(green, total, `expected ${total} green checks, got ${green}`);
});

test('strategy: logged output matches what `node` prints', () => {
  const r = runChecks(strategyDef, STRATEGY_SOLUTION);
  assert.deepEqual(r.logs, ['9', '25', '18', '67', '0']);
});

test('strategy: a context typed to a concrete rate is caught', () => {
  const r = runChecks(strategyDef,
    STRATEGY_SOLUTION.replace(/strategy: ShippingStrategy/g, 'strategy: StandardShipping'));
  assert.equal(r.steps[2].passed, false);
  assert.match(r.steps[2].checks.find((c) => !c.pass).message, /should take a `ShippingStrategy`/);
});

test('strategy: a context that implements the rate itself is caught', () => {
  const r = runChecks(strategyDef, STRATEGY_SOLUTION.replace(
    'return this.strategy.quote(parcel);',
    'return 5 + 2 * parcel.weightKg;'
  ));
  assert.equal(r.steps[2].passed, false, 'the swap must change the answer');
});

test('strategy: asStrategy() that ignores its function is caught', () => {
  const r = runChecks(strategyDef,
    STRATEGY_SOLUTION.replace('return { quote };', 'return { quote: () => 0 };'));
  assert.equal(r.steps[3].passed, false);
});

// ---------------------------------------------------------------- grading: factory method
section('== grading: factory method ==');

const factoryDef = require(path.join(ROOT, 'exercises/factory-method.js'));

const FACTORY_SOLUTION = `
interface Coffee {
  name: string;
  ounces: number;
  caffeineMg: number;
}

class Espresso implements Coffee {
  name = 'espresso';
  ounces = 1;
  caffeineMg = 64;
}

class ColdBrew implements Coffee {
  name = 'cold brew';
  ounces = 12;
  caffeineMg = 200;
}

abstract class CoffeeStand {
  cupsServed = 0;

  abstract brew(): Coffee;

  serve(): Coffee {
    const cup = this.brew();
    this.cupsServed++;
    return cup;
  }
}

class EspressoBar extends CoffeeStand {
  brew(): Coffee {
    return new Espresso();
  }
}

class ColdBrewCart extends CoffeeStand {
  brew(): Coffee {
    return new ColdBrew();
  }
}

const bar = new EspressoBar();
const cart = new ColdBrewCart();

console.log(bar.serve());
console.log(cart.serve());

const stands: CoffeeStand[] = [bar, cart];
for (const stand of stands) {
  console.log(stand.serve().name);
}

console.log(bar.cupsServed, cart.cupsServed);
`;

test('factory: the starting scaffold fails step 1 cleanly', () => {
  const r = runChecks(factoryDef, factoryDef.scaffold);
  assert.equal(r.fatal, false);
  assert.equal(r.steps[0].passed, false);
});

test('factory: the reference solution passes every step and every check', () => {
  const r = runChecks(factoryDef, FACTORY_SOLUTION);
  assert.equal(r.error, null, 'unexpected error: ' + r.error);
  assert.equal(r.steps.filter((s) => s.passed).length, factoryDef.steps.length);
  const total = factoryDef.steps.reduce((n, s) => n + s.checks.length, 0);
  const green = r.steps.reduce((n, s) => n + s.checks.filter((c) => c.pass).length, 0);
  assert.equal(green, total, `expected ${total} green checks, got ${green}`);
});

test('factory: logged output matches what `node` prints', () => {
  const r = runChecks(factoryDef, FACTORY_SOLUTION);
  assert.deepEqual(r.logs, [
    "Espresso { name: 'espresso', ounces: 1, caffeineMg: 64 }",
    "ColdBrew { name: 'cold brew', ounces: 12, caffeineMg: 200 }",
    'espresso',
    'cold brew',
    '2 2'
  ]);
});

test('factory: a creator that brews for itself instead of delegating is caught', () => {
  const r = runChecks(factoryDef,
    FACTORY_SOLUTION.replace('const cup = this.brew();', 'const cup = new Espresso();'));
  assert.equal(r.steps[2].passed, false);
  assert.match(r.steps[2].checks.find((c) => !c.pass).message, /should call this\.brew\(\)/);
});

test('factory: the creator\'s own logic is exercised — a missing tally is caught', () => {
  const r = runChecks(factoryDef, FACTORY_SOLUTION.replace('    this.cupsServed++;\n', ''));
  assert.equal(r.steps[2].passed, false);
});

test('factory: a factory method handing out a stored product is caught', () => {
  const r = runChecks(factoryDef, FACTORY_SOLUTION.replace(
    'class EspressoBar extends CoffeeStand {\n  brew(): Coffee {\n    return new Espresso();\n  }\n}',
    'class EspressoBar extends CoffeeStand {\n  private cup: Coffee = new Espresso();\n  brew(): Coffee {\n    return this.cup;\n  }\n}'
  ));
  assert.equal(r.steps[3].passed, false);
  assert.match(r.steps[3].checks.find((c) => !c.pass).message, /same object twice/);
});

test('factory: a factory method narrowed to the concrete product is caught', () => {
  const r = runChecks(factoryDef, FACTORY_SOLUTION.replace(
    'class ColdBrewCart extends CoffeeStand {\n  brew(): Coffee {',
    'class ColdBrewCart extends CoffeeStand {\n  brew(): ColdBrew {'
  ));
  assert.equal(r.steps[3].passed, false);
});

// ---------------------------------------------------------------- shared global scope
section('== shared global scope ==');

// Exercise files share one tsconfig and therefore one global scope, so a name used
// by two exercises is a duplicate-identifier error in the learner's editor. This is
// the authoring rule from the README, mechanised.
test('no two exercises declare the same top-level name', () => {
  const owners = new Map();
  const clashes = [];
  const solutions = [
    ['builder', SOLUTION],
    ['strategy', STRATEGY_SOLUTION],
    ['factory-method', FACTORY_SOLUTION]
  ];
  for (const [id, src] of solutions) {
    const declared = [
      ...src.matchAll(/^(?:abstract\s+)?(?:class|interface|type|function|const|let)\s+([A-Za-z_$][\w$]*)/gm)
    ].map((m) => m[1]);
    for (const name of declared) {
      if (owners.has(name)) clashes.push(`${name} (${owners.get(name)} + ${id})`);
      else owners.set(name, id);
    }
  }
  assert.deepEqual(clashes, [], 'clashing top-level names: ' + clashes.join(', '));
});

// ---------------------------------------------------------------- runtime limits
section('== runtime ==');

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

test('`abstract` still runs — the same lesson as readonly, one exercise later', () => {
  const r = runChecks(factoryDef, FACTORY_SOLUTION + '\nconsole.log(new (CoffeeStand as never)());\n');
  assert.equal(r.fatal, false, 'both the modifier and the bodiless method are simply erased');
  assert.equal(r.steps.filter((s) => s.passed).length, factoryDef.steps.length,
    'instantiating an abstract class is a type error only — nothing stops it at runtime');
});

test('an endless loop is stopped instead of hanging the extension host', () => {
  const r = runChecks(def, 'while (true) {}');
  assert.equal(r.fatal, true);
  assert.match(r.error, /more than 5 seconds/);
});

// ---------------------------------------------------------------- run
(async () => {
  for (const item of queue) {
    if (item.title) {
      console.log('\n' + item.title);
      continue;
    }
    try {
      await item.fn();
      console.log('  PASS  ' + item.name);
    } catch (e) {
      failures++;
      console.log('  FAIL  ' + item.name + '\n        ' + e.message);
    }
  }
  Module._load = origLoad;
  console.log(failures ? `\n${failures} FAILURE(S)\n` : `\nAll tests passed.\n`);
  process.exitCode = failures ? 1 : 0;
})();
