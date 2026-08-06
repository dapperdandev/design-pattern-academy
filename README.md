# 🥋 Pattern Dojo

A local, zero-build practice environment for learning design patterns by implementing
them — Codecademy-style. Instructions on the left, TypeScript editor on the right,
automated checks that gate each step until you pass it.

Companion to the blog series in `../blog` (`docs/posts/anatomy/`). Each exercise maps
onto the sections of its blog post, so finishing an exercise leaves you ready to write.

## Running it

Open `index.html` in a browser. That's it — no install, no build, no server.

```bash
start index.html
```

Requirements: a Chromium-based browser (for the optional **Watch a file** mode) and an
internet connection on first load, since the TypeScript compiler and its `lib.*.d.ts`
files are fetched from a CDN (~500 KB, then HTTP-cached).

### Type-checking

Running checks does a full `tsc --strict` type-check, not just a transpile. Errors are
listed with line and column, the offending code is underlined in the editor (hover for
the message), and the line number goes red in the gutter. Step checks stay locked until
the code type-checks — otherwise the runner would pass code that `tsc` rejects, since
types are erased at runtime and `readonly` violations still *run* perfectly well.

The header shows `strict types ✓` once the checker is live. If the lib files can't be
fetched it degrades to behaviour-only checks and says so, rather than pretending.

`console` is declared for you with exactly the four methods the runner implements
(`log`/`info`/`warn`/`error`) — the ES2020 lib has no `console`, and pulling in
`lib.dom` would be both heavy and a lie about what this sandbox provides.

### Two ways to work

- **In-page editor** — type in the right-hand pane. Code autosaves per exercise.
- **Watch a file** — click *👁 Watch a file*, pick a real `.ts` file (e.g.
  `../blog/sandbox/builder-pattern.ts`), then edit it in VS Code. Every save re-runs the
  checks here. The editor goes read-only while watching.

Progress is stored in `localStorage` under `dojo:<exercise-id>:*`, so it survives
reloads and shows on the home page. Nothing is sent anywhere.

## Layout

```
index.html              catalog of exercises, with progress
app/engine.css          all styling (catalog + exercise pages)
app/engine.js           the whole app: editor, TS highlighting, compile+run,
                        check runner, step gating, quiz, persistence, file watching
app/catalog.js          home-page rendering
exercises/manifest.js   which exercises exist, and which are planned
exercises/<id>/         one folder per exercise: index.html + exercise.js
exercises/_template/    copy this to start a new one
reference/              printable cheat sheets and the shared glossary
```

The split that matters: **`app/` is the engine and knows nothing about any pattern;
`exercises/<id>/exercise.js` is pure content.** Adding a pattern never means touching
the engine.

## Adding an exercise

1. `cp -r exercises/_template exercises/<id>` — the folder name **must** equal the
   `meta.id` you set inside (that convention is how the catalog links to it).
2. Edit `exercises/<id>/exercise.js`: fill in `meta`, `captures`, `expected`,
   `scaffold`, `steps`, `quiz`. The template documents every field and the check
   contract inline.
3. Add `'<id>'` to `exercises` in `exercises/manifest.js` (and remove it from
   `planned`).
4. Optionally add `reference/<id>-pattern.html` and link it from `meta.references`.

Nothing else. `index.html` picks it up automatically.

### Write a reference solution first

Before shipping an exercise, write the full solution in a scratch file and actually
run it:

```bash
node solution.ts && npx -p typescript tsc --noEmit --strict solution.ts
```

Then write `expected` from what it actually produced. A wrong expectation is worse than
no check — it teaches the learner that correct code is broken. Node 24 runs `.ts`
directly.

### Authoring guidance

- **One tangible win per exercise.** Keep each step inside working memory: teach only
  the knowledge that step needs, then make the learner produce something.
- **Checks are feedback, not a grade.** Every failure message should say what to do
  next, not just what's wrong.
- **Assert state, not formatted text.** Check fields, return values and identity.
  Never make the learner write a `toString`-style method just so a check can compare
  strings: it's copy-paste that teaches nothing about the pattern, and it makes every
  check brittle to formatting. `console.log(obj)` already prints an object readably
  here and in Node. Field assertions also give far better failures —
  `cheese should be "cheddar" but was "swiss"` beats a whole-string diff.
- **Hints, not answers.** Give the *shape* of one method in a `<details class="hint">`
  and let the learner generalise it.
- **Gate honestly.** Steps unlock in order and only the first failing check in a step
  is shown, so the learner always has exactly one thing to fix.
- **Quiz options must be indistinguishable by shape** — same rough length, no
  formatting tells. It's retrieval practice, not a reading-comprehension test.
- **Cite sources.** Prefer Refactoring.Guru, the GoF book, and the TypeScript handbook
  over parametric recall.

### Node type-stripping traps

Exercises are meant to be runnable via `node file.ts`, which erases types but performs
no transformation. Avoid, and warn learners about:

- `enum`
- constructor parameter properties — `constructor(private x: T)`

Declare fields and assign them in the constructor body instead.

## Teaching workspace

The learner-facing state for this series — mission, resources, notes, learning
records — lives in the blog repo (`../blog/MISSION.md`, `RESOURCES.md`, `NOTES.md`,
`learning-records/`), because it's about publishing the posts. This repo is only the
exercise platform.
