# 🎓 Design Pattern Academy

A VS Code extension for learning design patterns by implementing them. Lesson on one
side, your own TypeScript file on the other, gated steps and automated checks in between.

Each lesson opens with the pattern explained — what it is, the code you'd write without it,
the cast of roles — then has you build those roles one at a time, and finishes by making you
use what you built. Cheat sheets under `reference/` are the durable version.

## Why an extension

You write in a **real editor**, so squiggles, IntelliSense, go-to-definition and strict
type-checking all come from VS Code's own TypeScript service. The extension only supplies
what VS Code can't: the lesson, the step gating, and the behavioural checks that say
whether the *pattern* is right.

That division matters. Type errors and behaviour are different questions, and the extension
refuses to grade the second until the first is clean — types are erased at runtime, so a
`readonly` violation still *runs* perfectly well.

## Running it

No install, no build, no dependencies.

- **To develop it:** open this folder in VS Code and press <kbd>F5</kbd>. A second window
  opens with the extension loaded and `sandbox/` as its workspace.
- **To use it day to day:** symlink or copy this folder into your extensions directory,
  then reload VS Code.

```bash
cmd /c mklink /D "%USERPROFILE%\.vscode\extensions\design-pattern-academy" "K:\per\design-pattern-academy"
```

Then, in any open folder: **Design Pattern Academy: Open** from the Command Palette.

### Commands

| Command | Does |
| --- | --- |
| `Design Pattern Academy: Open` | Pick a pattern, scaffold its file, open lesson + editor side by side |
| `Design Pattern Academy: Run Checks` | Re-grade now (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Enter</kbd>) |
| `Design Pattern Academy: Reset Current Exercise` | Restore the starting scaffold and clear progress |
| `Design Pattern Academy: Open Reference Sheet` | Cheat sheets and the glossary, in Markdown preview |

Checks re-run on every save (`designPatternAcademy.runChecksOnSave`).

### Where your files go

Exercises go in the **folder you have open** — best used with a dedicated folder
(e.g. `K:\per\design-patterns`):

```
<workspace>/
  tsconfig.json         one shared config for all patterns: strict, ES2020, no ambient types
  dpa-globals.d.ts      one shared file: declares console (the ES2020 lib doesn't have it)
  builder/builder.ts    your code, one subfolder per pattern
  strategy/strategy.ts
  factory-method/factory-method.ts
  abstract-factory/abstract-factory.ts
```

The two support files exist because the TypeScript server discovers configuration by
walking up the directory tree from the file — extensions can't inject compiler options.
Putting them once at the root is what avoids a copy per pattern.

They're written only if missing or previously written by this extension (marker comment).
A `tsconfig.json` you own is never touched — the checks then gate on whatever diagnostics
your config produces.

Step and quiz progress live in extension state, not in the files, so the folder stays
clean enough to `git init` if you want your solutions in version control.

## Layout

```
package.json            extension manifest — the only config, no build
extension.js            commands, scaffolding, save-watching, type-error gating
src/checker.js          runs the learner's file and grades it against the definition
src/panel.js            builds the lesson webview
media/panel.{css,js}    webview styling (VS Code theme variables) and gating/quiz logic
exercises/<id>.js       one file per pattern: pure content
exercises/_template.js  documented skeleton + the check contract
reference/*.md          cheat sheets and glossary, read via Markdown preview
test/run-tests.js       smoke tests, no framework
```

The split that matters: **`extension.js` + `src/` know nothing about any pattern;
`exercises/<id>.js` is pure content.** Adding a pattern never means touching the engine.

## Adding an exercise

1. `cp exercises/_template.js exercises/<id>.js` — the file name should match `meta.id`.
2. Fill in `meta`, `captures`, `expected`, `scaffold`, `steps`, `quiz`. The template
   documents every field and the check contract inline.
3. Optionally add `reference/<id>-pattern.md` and list it in `meta.references`.
4. Run `node test/run-tests.js` — it validates every exercise's shape.

Nothing else: the extension discovers every non-underscored `.js` in `exercises/`.

### Write a reference solution first

Before shipping an exercise, write the full solution in a scratch file and run it:

```bash
node solution.ts && npx -p typescript tsc --noEmit --strict solution.ts
```

Then write `expected` from what it actually produced. A wrong expectation is worse than no
check — it teaches the learner that correct code is broken. Node 24 runs `.ts` directly.

### Authoring guidance

- **Explain the pattern before the first step.** `meta.intro` is where a reader who knows
  nothing about it learns what it is, what it fixes, and which roles they're about to build.
  Steps teach one role each; they are not the place for the overview.
- **Self-contained.** Link public sources only. No private repos, notes or side projects, and
  nothing that assumes the reader is the author.
- **One tangible win per exercise.** Keep each step inside working memory: teach only the
  knowledge that step needs, then make the learner produce something.
- **Checks are feedback, not a grade.** Every failure message should say what to do next.
- **Assert state, not formatted text.** Check fields, return values and identity. Never
  make the learner write a `toString`-style method just so a check can compare strings:
  it's copy-paste that teaches nothing, and it makes checks brittle to formatting.
  Field assertions also give better failures — `cheese should be "cheddar" but was "swiss"`
  beats a whole-string diff.
- **Grade behaviour, not typography.** Numbers, identity and union-typed values compare
  exactly; a *display* string compares loosely (lowercase, strip non-alphanumerics), because
  failing someone for `'Cold Brew'` teaches them nothing about the pattern. Say so in the
  prose, so the leniency is visible rather than lucky.
- **Don't check types.** VS Code does that, and the extension already blocks on it. Your
  checks are about behaviour.
- **Top-level names must be unique across all exercises.** Every exercise file shares one
  tsconfig and therefore one global scope — two exercises both declaring `Product` is a
  duplicate-identifier error in the learner's editor. Using a different domain per pattern
  (sandwiches, coffee, houses…) makes this automatic.
- **Don't let a check pass by luck.** If the prose asks for something, exercise the case
  that needs it — the director's `reset()` only proves itself against a builder left
  mid-order.
- **Hints, not answers.** Give the *shape* of one method in a `<details>` and let the
  learner generalise it.
- **Quiz options must be indistinguishable by shape** — same rough length, no formatting
  tells. It's retrieval practice, not reading comprehension.
- **Cite sources.** Prefer Refactoring.Guru, the GoF book, and the TypeScript handbook over
  parametric recall.

### Node type-stripping traps

Exercise files are meant to run via `node <id>.ts`, which erases types but performs no
transformation. These fail at runtime, so warn learners in the prose:

- `enum`
- constructor parameter properties — `constructor(private x: T)`

Declare the field and assign it in the constructor body instead.

`abstract` is fine — the modifier and the bodiless method are both erased. Which means
`new SomeAbstractClass()` *runs*: like `readonly`, it's caught by the type-checker alone.

## Tests

```bash
node test/run-tests.js
```

Stubs the `vscode` module so it runs outside VS Code. Checks that every command declared in
`package.json` is registered, that every exercise definition is well-formed, that each
reference solution scores full marks and logs exactly what `node` prints, that the mistakes
each exercise warns about are actually caught, that no two exercises claim the same top-level
name, and that the traps we care about still fail — including that `readonly` and `abstract`
both *run* fine, which is precisely why gating on VS Code's type errors is not optional.

Two of those tests exist to keep the lessons honest as the set grows: every exercise must
carry an up-front explanation with its cast of roles, and no lesson may refer to a private
repo, notes, or project. A lesson that only makes sense to its author isn't a lesson.
