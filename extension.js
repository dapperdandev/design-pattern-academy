/**
 * Design Pattern Academy — a VS Code extension.
 *
 * The learner writes real TypeScript in a real editor, so squiggles, IntelliSense
 * and strict type-checking all come from VS Code's own TypeScript service. This
 * extension supplies what VS Code can't: the lesson, the gating, and the
 * behavioural checks that say whether the *pattern* is right.
 *
 * Plain CommonJS with no dependencies and no build step — `main` points straight
 * at this file.
 */
'use strict';

const vscode = require('vscode');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const { runChecks } = require('./src/checker.js');
const { panelHtml } = require('./src/panel.js');

const EXERCISE_DIR = path.join(__dirname, 'exercises');
const REFERENCE_DIR = path.join(__dirname, 'reference');

// ---------------------------------------------------------------- exercises

function listExercises() {
  return fs
    .readdirSync(EXERCISE_DIR)
    .filter((f) => f.endsWith('.js') && !f.startsWith('_'))
    .map((f) => {
      const full = path.join(EXERCISE_DIR, f);
      delete require.cache[require.resolve(full)]; // pick up edits without reloading the window
      const def = require(full);
      return { id: def.meta.id, def };
    })
    .sort((a, b) => String(a.def.meta.number).localeCompare(String(b.def.meta.number)));
}

// ---------------------------------------------------------------- scaffolding

/**
 * Exercises live in a home folder (default ~/design-pattern-academy), never in
 * whatever repo happens to be open. The tsconfig and globals file MUST sit next
 * to the exercise code — the TypeScript server discovers config by walking up
 * from the file, and extensions can't inject compiler options — so keeping the
 * whole nest out of the user's projects is the only clean place for it.
 */
function academyHome() {
  let dir = String(
    vscode.workspace.getConfiguration('designPatternAcademy').get('home') || ''
  ).trim();
  if (!dir) return path.join(os.homedir(), 'design-pattern-academy');
  if (dir === '~') return os.homedir();
  if (dir.startsWith('~/') || dir.startsWith('~\\')) {
    return path.join(os.homedir(), dir.slice(2));
  }
  return dir;
}

/** Per-exercise folder: separate tsconfig so two exercises never collide in one global scope. */
function exerciseUris(def) {
  const dir = vscode.Uri.file(path.join(academyHome(), def.meta.id));
  return {
    dir,
    file: vscode.Uri.joinPath(dir, `${def.meta.id}.ts`),
    tsconfig: vscode.Uri.joinPath(dir, 'tsconfig.json'),
    globals: vscode.Uri.joinPath(dir, 'dpa-globals.d.ts')
  };
}

const TSCONFIG = `{
  // Strict, and no ambient @types: what the exercise checks is what you wrote.
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "strict": true,
    "noEmit": true,
    "types": []
  },
  "include": ["*.ts"]
}
`;

const GLOBALS = `// Supplied by Design Pattern Academy.
// The ES2020 lib has no \`console\`; these are exactly the methods the exercise
// runner implements, so what type-checks here is what actually runs.
declare var console: {
  log(...data: unknown[]): void;
  info(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
};
`;

async function exists(uri) {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

async function scaffold(def, { overwrite = false } = {}) {
  const uris = exerciseUris(def);
  await vscode.workspace.fs.createDirectory(uris.dir);
  const enc = new TextEncoder();
  // config files are always refreshed; the learner's code is never overwritten
  await vscode.workspace.fs.writeFile(uris.tsconfig, enc.encode(TSCONFIG));
  await vscode.workspace.fs.writeFile(uris.globals, enc.encode(GLOBALS));
  if (overwrite || !(await exists(uris.file))) {
    await vscode.workspace.fs.writeFile(uris.file, enc.encode(def.scaffold || ''));
  }
  return uris;
}

// ---------------------------------------------------------------- sidebar

/** How far through an exercise the learner is, from persisted state. */
function progressFor(context, def) {
  const total = (def.steps || []).length + ((def.quiz || []).length ? 1 : 0);
  const steps = context.globalState.get(`dpa.${def.meta.id}.steps`, []);
  const quiz = context.globalState.get(`dpa.${def.meta.id}.quiz`, []);
  const quizDone = (def.quiz || []).length > 0 && def.quiz.every((_q, i) => quiz[i]);
  const done = Math.min(steps.filter(Boolean).length + (quizDone ? 1 : 0), total);
  return { done, total, complete: total > 0 && done >= total };
}

/** Activity-bar tree: exercises with live progress, reference sheets below. */
class ExerciseTree {
  constructor(context) {
    this.context = context;
    this._emitter = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._emitter.event;
  }

  refresh() {
    this._emitter.fire(undefined);
  }

  getTreeItem(item) {
    return item;
  }

  getChildren(element) {
    if (!element) {
      const items = listExercises().map(({ def }) => this.exerciseItem(def));
      items.push(this.referenceRoot());
      return items;
    }
    if (element.contextValue === 'dpa.referenceRoot' && fs.existsSync(REFERENCE_DIR)) {
      return fs
        .readdirSync(REFERENCE_DIR)
        .filter((f) => f.endsWith('.md'))
        .map((f) => this.referenceItem(f));
    }
    return [];
  }

  exerciseItem(def) {
    const p = progressFor(this.context, def);
    const item = new vscode.TreeItem(`${def.meta.number} · ${def.meta.title}`);
    item.description = p.complete ? 'Complete ✓' : `${p.done}/${p.total}`;
    item.tooltip = def.meta.blurb || def.meta.title;
    item.iconPath = p.complete
      ? new vscode.ThemeIcon('pass-filled', new vscode.ThemeColor('testing.iconPassed'))
      : new vscode.ThemeIcon(p.done > 0 ? 'play-circle' : 'circle-large-outline');
    item.command = { command: 'designPatternAcademy.open', title: 'Open', arguments: [def.meta.id] };
    item.contextValue = 'dpa.exercise';
    return item;
  }

  referenceRoot() {
    const item = new vscode.TreeItem('Reference sheets', vscode.TreeItemCollapsibleState.Collapsed);
    item.iconPath = new vscode.ThemeIcon('book');
    item.contextValue = 'dpa.referenceRoot';
    return item;
  }

  referenceItem(name) {
    const item = new vscode.TreeItem(name.replace(/\.md$/, ''));
    item.iconPath = new vscode.ThemeIcon('markdown');
    item.command = { command: 'designPatternAcademy.openReference', title: 'Open', arguments: [name] };
    item.contextValue = 'dpa.reference';
    return item;
  }
}

// ---------------------------------------------------------------- session

class Session {
  constructor(context) {
    this.context = context;
    this.panel = null;
    this.def = null;
    this.uris = null;
    this.disposables = [];
    this.onProgress = null; // sidebar refresh hook
  }

  notifyProgress() {
    if (this.onProgress) this.onProgress();
  }

  key(what) {
    return `dpa.${this.def.meta.id}.${what}`;
  }

  progress() {
    return {
      quiz: this.context.globalState.get(this.key('quiz'), []),
      steps: this.context.globalState.get(this.key('steps'), [])
    };
  }

  async open(def) {
    this.def = def;
    this.uris = await scaffold(def);
    const uris = this.uris;

    const doc = await vscode.workspace.openTextDocument(uris.file);
    await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.One, preview: false });

    if (this.panel) {
      this.panel.dispose();
    }
    this.panel = vscode.window.createWebviewPanel(
      'designPatternAcademy',
      `${def.meta.number} · ${def.meta.title}`,
      { viewColumn: vscode.ViewColumn.Two, preserveFocus: true },
      { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [vscode.Uri.file(__dirname)] }
    );
    this.panel.webview.html = panelHtml(this.panel.webview, __dirname, def, this.progress());
    this.panel.onDidDispose(() => {
      this.panel = null;
      this.disposeWatchers();
    });
    this.panel.webview.onDidReceiveMessage((msg) => this.onMessage(msg));

    this.disposeWatchers();
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((saved) => {
        const onSave = vscode.workspace
          .getConfiguration('designPatternAcademy')
          .get('runChecksOnSave', true);
        if (onSave && saved.uri.toString() === this.uris.file.toString()) {
          this.runChecks();
        }
      })
    );

    this.runChecks();
  }

  disposeWatchers() {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }

  onMessage(msg) {
    if (!msg) return;
    if (msg.type === 'runChecks') this.runChecks();
    if (msg.type === 'openFile' && this.uris) {
      vscode.workspace
        .openTextDocument(this.uris.file)
        .then((doc) => vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.One }));
    }
    if (msg.type === 'quiz') {
      const quiz = this.context.globalState.get(this.key('quiz'), []);
      quiz[msg.index] = true;
      this.context.globalState.update(this.key('quiz'), quiz).then(() => this.notifyProgress());
    }
    if (msg.type === 'reference') {
      openReference(msg.name);
    }
  }

  /**
   * Type errors come from VS Code's TypeScript service — the same ones underlined
   * in the editor. Behavioural checks stay locked until the file type-checks,
   * because types are erased at runtime: a readonly violation still *runs*.
   */
  async runChecks() {
    if (!this.panel || !this.def || !this.uris) return;
    const post = (payload) => this.panel && this.panel.webview.postMessage(payload);
    post({ type: 'busy' });

    let doc;
    try {
      doc = await vscode.workspace.openTextDocument(this.uris.file);
    } catch {
      post({ type: 'results', missingFile: true });
      return;
    }
    const source = doc.getText();

    await new Promise((r) => setTimeout(r, 300)); // let the TS server catch up after a save
    const typeErrors = vscode.languages
      .getDiagnostics(this.uris.file)
      .filter((d) => d.severity === vscode.DiagnosticSeverity.Error)
      .map((d) => ({
        line: d.range.start.line + 1,
        col: d.range.start.character + 1,
        message: typeof d.message === 'string' ? d.message : String(d.message)
      }))
      .sort((a, b) => a.line - b.line);

    if (typeErrors.length) {
      await this.context.globalState.update(this.key('steps'), []);
      this.notifyProgress();
      post({ type: 'results', typeErrors, progress: this.progress() });
      return;
    }

    const report = runChecks(this.def, source);
    await this.context.globalState.update(
      this.key('steps'),
      report.steps.map((s) => s.passed)
    );
    this.notifyProgress();
    post({ type: 'results', report, progress: this.progress() });
  }

  async reset() {
    if (!this.def) {
      vscode.window.showInformationMessage('No exercise is open.');
      return;
    }
    const answer = await vscode.window.showWarningMessage(
      `Reset ${this.def.meta.title}? Your code in ${this.def.meta.id}.ts will be replaced by the starting scaffold and your quiz answers cleared.`,
      { modal: true },
      'Reset'
    );
    if (answer !== 'Reset') return;
    await scaffold(this.def, { overwrite: true });
    await this.context.globalState.update(this.key('quiz'), []);
    await this.context.globalState.update(this.key('steps'), []);
    this.notifyProgress();
    if (this.panel) {
      this.panel.webview.html = panelHtml(this.panel.webview, __dirname, this.def, this.progress());
    }
    this.runChecks();
  }
}

// ---------------------------------------------------------------- reference

function openReference(name) {
  const file = path.join(REFERENCE_DIR, name);
  if (!fs.existsSync(file)) {
    vscode.window.showErrorMessage(`Reference sheet not found: ${name}`);
    return;
  }
  // Markdown preview is the VS Code-native way to read these
  vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(file));
}

async function pickReference() {
  if (!fs.existsSync(REFERENCE_DIR)) return;
  const picks = fs.readdirSync(REFERENCE_DIR).filter((f) => f.endsWith('.md'));
  const chosen = await vscode.window.showQuickPick(picks, { placeHolder: 'Reference sheet' });
  if (chosen) openReference(chosen);
}

// ---------------------------------------------------------------- activation

function activate(context) {
  const session = new Session(context);
  const tree = new ExerciseTree(context);
  session.onProgress = () => tree.refresh();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('designPatternAcademy.exercises', tree),

    // `exerciseId` arrives when a sidebar item is clicked; the palette passes nothing.
    vscode.commands.registerCommand('designPatternAcademy.open', async (exerciseId) => {
      const exercises = listExercises();
      if (!exercises.length) {
        vscode.window.showErrorMessage('No exercises found in the extension\'s exercises/ folder.');
        return;
      }
      let chosen = typeof exerciseId === 'string'
        ? exercises.find((e) => e.id === exerciseId)
        : exercises[0];
      if (!chosen) chosen = exercises[0];
      if (typeof exerciseId !== 'string' && exercises.length > 1) {
        const items = exercises.map(({ def }) => {
          const done = context.globalState.get(`dpa.${def.meta.id}.steps`, []).filter(Boolean).length;
          const total = (def.steps || []).length;
          return {
            label: `${def.meta.emoji || ''} ${def.meta.number} · ${def.meta.title}`.trim(),
            description: done >= total && total ? 'complete' : `${done}/${total} steps`,
            detail: def.meta.blurb,
            id: def.meta.id
          };
        });
        const pick = await vscode.window.showQuickPick(items, { placeHolder: 'Which pattern?' });
        if (!pick) return;
        chosen = exercises.find((e) => e.id === pick.id);
      }
      await session.open(chosen.def);
    }),

    vscode.commands.registerCommand('designPatternAcademy.runChecks', () => {
      if (!session.panel) {
        vscode.commands.executeCommand('designPatternAcademy.open');
        return;
      }
      session.runChecks();
    }),

    vscode.commands.registerCommand('designPatternAcademy.resetExercise', () => session.reset()),
    // `name` arrives from a sidebar reference item; the palette shows the picker.
    vscode.commands.registerCommand('designPatternAcademy.openReference', (name) =>
      typeof name === 'string' ? openReference(name) : pickReference()
    ),

    { dispose: () => session.disposeWatchers() }
  );
}

function deactivate() {}

module.exports = { activate, deactivate, listExercises, scaffold };
