/**
 * TEMPLATE — copy this folder to exercises/<your-id>/ and fill it in.
 * Then add the folder name to exercises/manifest.js so it shows on the catalog.
 *
 * This file is content only: prose, expected output, checks, quiz. Every bit of
 * app machinery (editor, highlighting, TS compile, gating, persistence) is in
 * app/engine.js and needs no changes to add an exercise.
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
 * Verify every expected string by actually running a reference solution before
 * shipping — a wrong expectation is worse than no check.
 */
Dojo.register({
  meta: {
    id: 'my-pattern',                  // unique; also the localStorage namespace
    number: '0002',                    // sort order on the catalog
    title: 'The Example Pattern',
    heading: 'A short imperative hook',  // <h2> in the left panel
    emoji: '🧩',
    domain: 'Some concrete domain',
    category: 'Creational',            // Creational | Structural | Behavioral
    blurb: 'One or two sentences for the catalog card.',
    missionNote: '<b>Mission tie-in:</b> why this exercise exists, and what it feeds.',
    howto: 'Work in the editor →, or click <b>Watch a file</b> to code in your own editor.',
    primarySource: {
      url: 'https://refactoring.guru/design-patterns/',
      label: 'Pattern — Refactoring.Guru',
      note: '(what to trust it for).'
    },
    references: [
      { href: '../../reference/design-patterns-glossary.html', label: 'Design-patterns glossary' }
    ],
    finale: '🎉 <b>All checks green.</b> What to do next to make it stick.'
  },

  // Declarations to lift out of the learner's compiled code for use as c.g.<Name>.
  // Classes and functions work; interfaces and types do NOT exist at runtime —
  // assert those against c.clean instead.
  captures: ['Thing'],

  // Central place for expected output, so prose and checks can't drift apart.
  expected: {
    plain: 'a default thing'
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
        '<pre class="snippet">console.log(new Thing().listParts());</pre>' +
        '<div class="expected">a default thing</div>',
      checks: [
        {
          name: 'class Thing exists',
          run: function (c) {
            if (typeof c.g.Thing !== 'function') return 'No Thing class found yet.';
          }
        },
        {
          name: 'listParts() reads right',
          run: function (c) { return c.eq(new c.g.Thing().listParts(), c.expect.plain); }
        }
      ]
    }
  ],

  // Optional. When present the engine appends it as a final gated step.
  // Keep option strings the same length — formatting must not hint at the answer.
  quiz: [
    {
      q: 'A recall question, not a recognition question?',
      options: ['first plausible', 'second plausible', 'third plausible', 'fourth plausible'],
      answer: 0,
      explain: 'Why that\'s right, and why the tempting wrong one is wrong.'
    }
  ]
});
