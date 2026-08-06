/**
 * TEMPLATE — copy to exercises/<your-id>.js and fill it in. That's the whole
 * install step: the extension discovers every non-underscored .js in this folder.
 *
 * This file is content only: prose, expectations, checks, quiz. The extension
 * supplies the lesson panel, gating and persistence; VS Code supplies the editor,
 * IntelliSense and strict type-checking. Adding a pattern touches nothing else.
 *
 * Do NOT write checks for type errors — VS Code reports those itself, and the
 * extension already blocks the step checks until the file type-checks. Your
 * checks are only about behaviour: does the pattern actually work?
 *
 * ── The check contract ────────────────────────────────────────────────
 * Each check gets a ctx and returns a FAILURE MESSAGE string, or nothing to pass.
 * A thrown error is caught and shown as the failure, so `new c.g.Thing()` on
 * code that doesn't compile fails gracefully.
 *
 *   c.g              the learner's declarations named in `captures`
 *   c.logs           array of console output lines
 *   c.src            raw source text
 *   c.clean          source with comments stripped (use for text assertions)
 *   c.expect         your `expected` object
 *   c.eq(got, want)  standard 'Expected "x" but got "y".' message, or null
 *   c.missingLines([...])  which expected console lines are absent
 *
 * Steps are gated in order: a step unlocks only when every earlier step passes,
 * and only the FIRST failing check in a step is shown, to keep the signal high.
 * Verify every expectation by actually running a reference solution before
 * shipping — a wrong expectation is worse than no check.
 *
 * Prefer asserting on STATE (fields, return values, identity) over formatted
 * text. Requiring the learner to write a toString-style method just so a check
 * can compare strings adds copy-paste that teaches nothing about the pattern,
 * and makes every check brittle to formatting. `console.log(obj)` already
 * renders an object readably in the panel and under `node`.
 *
 * Node runs the exercise file with type stripping, so `enum` and constructor
 * parameter properties fail at runtime. Warn the learner in the prose.
 */
'use strict';

module.exports = {
  meta: {
    id: 'my-pattern',                  // unique; also the file name and state namespace
    number: '0002',                    // sort order in the exercise picker
    title: 'The Example Pattern',
    heading: 'A short imperative hook',  // <h1> in the panel
    emoji: '🧩',
    domain: 'Some concrete domain',
    category: 'Creational',            // Creational | Structural | Behavioral
    blurb: 'One or two sentences for the exercise picker.',
    missionNote: '<b>Mission tie-in:</b> why this exercise exists, and what it feeds.',
    howto: 'Write your code in <code>my-pattern.ts</code> beside this panel. Every save re-runs ' +
      'the checks.',
    primarySource: {
      url: 'https://refactoring.guru/design-patterns/',
      label: 'Pattern — Refactoring.Guru',
      note: '(what to trust it for).'
    },
    references: [
      // `name` opens reference/<name> in VS Code's Markdown preview;
      // use `href` instead for an external URL.
      { name: 'design-patterns-glossary.md', label: 'Design-patterns glossary' }
    ],
    finale: '🎉 <b>All checks green.</b> What to do next to make it stick.'
  },

  // Declarations to lift out of the learner's compiled code for use as c.g.<Name>.
  // Classes and functions work; interfaces and types do NOT exist at runtime —
  // assert those against c.clean instead.
  captures: ['Thing'],

  // Central place for expectations, so prose and checks can't drift apart.
  // Field sets beat formatted strings — see the note above.
  expected: {
    plain: { size: 'small', extras: [] }
  },

  scaffold: [
    '// -- STEP 1 - ... ----------------------------------------------',
    ''
  ].join('\n'),

  steps: [
    {
      title: 'First role',
      chip: 'blog: Dissection → Role',       // optional badge, top-right of the step
      body:
        '<p>Teach the knowledge needed for <i>this step only</i> — working memory is small.</p>' +
        '<p><b>Write:</b></p><ul><li>…</li></ul>' +
        '<details class="hint"><summary>Hint — one method as a template</summary>' +
        '<pre class="snippet">// give the shape, not the answer</pre></details>' +
        '<p><b>Checkpoint:</b></p>' +
        '<pre class="snippet">console.log(new Thing());</pre>' +
        '<div class="expected">Thing { size: \'small\', extras: [] }</div>',
      checks: [
        {
          name: 'class Thing exists',
          run: function (c) {
            if (typeof c.g.Thing !== 'function') return 'No Thing class found yet.';
          }
        },
        {
          name: 'sensible defaults',
          run: function (c) {
            var t = new c.g.Thing();
            if (t.size !== c.expect.plain.size) {
              return 'size should default to "' + c.expect.plain.size + '" but was "' + t.size + '".';
            }
            if (!Array.isArray(t.extras) || t.extras.length) return 'extras should default to [].';
          }
        }
      ]
    }
  ],

  // Optional. When present it becomes a final gated step.
  // Keep option strings the same length — formatting must not hint at the answer.
  quiz: [
    {
      q: 'A recall question, not a recognition question?',
      options: ['first plausible', 'second plausible', 'third plausible', 'fourth plausible'],
      answer: 0,
      explain: 'Why that\'s right, and why the tempting wrong one is wrong.'
    }
  ]
};
