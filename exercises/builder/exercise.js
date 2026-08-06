/**
 * Exercise 0001 — Builder pattern, sandwich shop edition.
 * Content only. All app machinery lives in app/engine.js.
 *
 * The product deliberately has NO text-rendering method: it would teach nothing
 * about the pattern, and it made every check brittle to formatting. Checks
 * assert the fields the builder actually set instead.
 */
(function () {
  'use strict';

  var FIELDS = ['bread', 'decks', 'cheese', 'toasted'];

  /** Compare a built sandwich against an expected field set. Returns a message, or null when it matches. */
  function wrong(got, want) {
    if (!got || typeof got !== 'object') return 'build() did not return a Sandwich.';
    for (var i = 0; i < FIELDS.length; i++) {
      var k = FIELDS[i];
      if (got[k] !== want[k]) {
        return k + ' should be ' + JSON.stringify(want[k]) + ' but was ' + JSON.stringify(got[k]) + '.';
      }
    }
    var g = (got.toppings || []).join(' + ') || '(none)';
    var w = (want.toppings || []).join(' + ') || '(none)';
    if (g !== w) return 'toppings should be ' + w + ' but were ' + g + '.';
    return null;
  }

  Dojo.register({
    meta: {
      id: 'builder',
      number: '0001',
      title: 'The Builder Pattern',
      heading: 'Order up: build the Builder',
      emoji: '🥪',
      domain: 'Sandwich shop',
      category: 'Creational',
      blurb: 'Assemble a sandwich step by step. Product, Builder, Concrete Builder, ' +
             'Director — your first pattern where roles collaborate.',
      missionNote: '<b>Mission tie-in:</b> everything you write here becomes the <i>Example</i> and ' +
        '<i>Dissection</i> sections of <code>docs/posts/drafts/builder-pattern.md</code> in the blog ' +
        'repo. Singleton was one class; Builder is your first pattern where <i>roles collaborate</i>.',
      howto: 'Work in the editor →, or click <b>Watch a file</b> to code in VS Code ' +
        '(<code>blog/sandbox/builder-pattern.ts</code>) with live checking here. You can also run ' +
        'that file directly: <code>node sandbox/builder-pattern.ts</code>.',
      primarySource: {
        url: 'https://refactoring.guru/design-patterns/builder',
        label: 'Builder — Refactoring.Guru',
        note: '(roles, applicability, director optionality). Canonical reference: ' +
              '<i>Design Patterns</i>, Gamma, Helm, Johnson &amp; Vlissides (1994).'
      },
      references: [
        { href: '../../reference/builder-pattern.html', label: 'Builder cheat sheet' },
        { href: '../../reference/design-patterns-glossary.html', label: 'Design-patterns glossary' }
      ],
      finale: '🎉 <b>All checks green.</b> To make it stick:' +
        '<ul style="margin:8px 0 0; padding-left:18px;">' +
        '<li><b>Now:</b> draft the <i>Dissection</i> section of your post from memory, one heading ' +
          'per role — then check back against your code.</li>' +
        '<li><b>After drafting:</b> compare your implementation with ' +
          '<a href="https://refactoring.guru/design-patterns/builder/typescript/example" ' +
          'target="_blank">Refactoring.Guru\'s TS example</a> — note one thing you\'d defend doing ' +
          'differently.</li>' +
        '<li><b>In ~2 days:</b> delete your sandbox file body and rebuild it cold. ' +
          'Spaced retrieval beats rereading.</li>' +
        '<li><b>Then:</b> tell Claude you\'re done — I\'ll review your code against the pattern ' +
          'and help outline the post.</li></ul>'
    },

    // declarations lifted out of the learner's code so checks can exercise them
    captures: ['Sandwich', 'DeliSandwichBuilder', 'SandwichArtist'],

    // What each order should contain. Fields, not formatted text — so the checks
    // test the pattern's behaviour and nothing depends on how it's printed.
    expected: {
      plain:         { bread: 'white', decks: 1, cheese: null,      toppings: [],                  toasted: false },
      custom:        { bread: 'rye',   decks: 2, cheese: null,      toppings: ['pastrami'],        toasted: false },
      grilledCheese: { bread: 'white', decks: 1, cheese: 'cheddar', toppings: [],                  toasted: true },
      club:          { bread: 'wheat', decks: 2, cheese: 'swiss',   toppings: ['turkey', 'bacon'], toasted: true }
    },

    scaffold: [
      '/**',
      ' * THE BUILDER PATTERN - sandwich shop edition',
      ' * Follow the steps in the left panel. Run checks: Ctrl+Enter.',
      ' */',
      '',
      '// -- STEP 1 - PRODUCT ------------------------------------------',
      '',
      '',
      '// -- STEP 2 - BUILDER INTERFACE --------------------------------',
      '',
      '',
      '// -- STEP 3 - CONCRETE BUILDER ---------------------------------',
      '',
      '',
      '// -- STEP 4 - DIRECTOR -----------------------------------------',
      '',
      '',
      '// -- STEP 5 - USAGE --------------------------------------------',
      ''
    ].join('\n'),

    steps: [
      {
        title: 'The Product',
        chip: 'blog: Dissection → Product',
        body:
          '<p>The <b>Product</b> is the complex object being assembled — a <code>Sandwich</code>. ' +
          'It knows <i>nothing</i> about builders, and it needs no methods at all: it is just the ' +
          'fields that describe an order.</p>' +
          '<p>Why does this pattern exist? Imagine the alternative — one constructor trying to cover ' +
          'every order: <code>new Sandwich(\'rye\', 2, \'swiss\', [\'pastrami\'], true)</code>. ' +
          'Five positional arguments, most optional, impossible to read. That\'s the ' +
          '<a href="https://refactoring.guru/design-patterns/builder" target="_blank">' +
          '"telescoping constructor"</a> problem Builder solves.</p>' +
          '<p><b>Write:</b></p><ul>' +
          '<li>Type aliases: <code>Bread = \'white\' | \'wheat\' | \'rye\'</code> and ' +
            '<code>Cheese = \'cheddar\' | \'swiss\'</code></li>' +
          '<li><code>class Sandwich</code> with five fields, each with a default: ' +
            '<code>bread: Bread = \'white\'</code>, <code>decks = 1</code> (a club sandwich is a ' +
            'double-decker), <code>cheese: Cheese | null = null</code>, ' +
            '<code>toppings: string[] = []</code>, <code>toasted = false</code></li></ul>' +
          '<p class="why">Note what the <code>Cheese</code> type does <i>not</i> contain: a member ' +
          'meaning "no cheese". Absence isn\'t a kind of cheese, so it\'s <code>null</code> rather ' +
          'than a sentinel like <code>\'none\'</code> — and <code>setCheese()</code> then can\'t be ' +
          'called with a non-cheese. Give it an explicit <code>= null</code> rather than making the ' +
          'field optional: an optional field with no initializer doesn\'t exist at all once ' +
          'transpiled here, but does exist as <code>undefined</code> under <code>node</code>, so the ' +
          'two disagree.</p>' +
          '<p class="why">Leave the fields mutable — no <code>readonly</code>. The builder\'s whole ' +
          'job in step 3 is to set them one at a time, and <code>readonly</code> would reject that ' +
          'under <code>tsc --strict</code>.</p>' +
          '<p><b>Checkpoint</b> — add this line and hit <i>Run checks</i>:</p>' +
          '<pre class="snippet">console.log(new Sandwich());</pre>' +
          '<div class="expected">Sandwich { bread: \'white\', decks: 1, cheese: null, toppings: [], toasted: false }</div>' +
          '<p class="why">Logging the object is all you need to see your work — no formatting method ' +
          'required. <code>node</code> prints the same fields, wrapped across several lines.</p>',
        checks: [
          {
            name: 'class Sandwich exists',
            run: function (c) {
              if (typeof c.g.Sandwich !== 'function') return 'No Sandwich class found yet.';
            }
          },
          {
            name: 'five fields, with sensible defaults',
            run: function (c) {
              var s = new c.g.Sandwich();
              if (!Array.isArray(s.toppings)) return 'toppings should default to an empty array [].';
              return wrong(s, c.expect.plain);
            }
          }
        ]
      },

      {
        title: 'The Builder interface',
        chip: 'blog: Dissection → Builder',
        body:
          '<p>The <b>Builder</b> declares the construction steps, abstracted away from any particular ' +
          'implementation. Type this in by hand (don\'t paste — read each line as you go):</p>' +
          '<pre class="snippet">interface SandwichBuilder {\n' +
          '  reset(): this;\n' +
          '  setBread(bread: Bread): this;\n' +
          '  addDeck(): this;\n' +
          '  setCheese(cheese: Cheese): this;\n' +
          '  addTopping(topping: string): this;\n' +
          '  toast(): this;\n' +
          '  build(): Sandwich;\n' +
          '}</pre>' +
          '<p class="why">Every step returns <code>this</code> — TypeScript\'s ' +
          '<a href="https://www.typescriptlang.org/docs/handbook/2/classes.html#this-types" ' +
          'target="_blank">polymorphic <code>this</code> type</a>. That single decision is what makes ' +
          'chaining (the <b>Fluent API</b> in your blog outline) possible. Only <code>build()</code> ' +
          'breaks the chain — it hands over the product.</p>' +
          '<p><b>Checkpoint:</b> run checks. (Fun fact the checker will teach you: interfaces are ' +
          'erased at compile time, so this step is verified by reading your <i>source text</i>, not ' +
          'your running code.)</p>',
        checks: [
          {
            name: 'interface SandwichBuilder declared',
            run: function (c) {
              if (!/interface\s+SandwichBuilder\b/.test(c.clean)) {
                return 'Declare `interface SandwichBuilder { ... }`. (Interfaces are erased at ' +
                  'compile time, so this check reads your source text — there is nothing left of an ' +
                  'interface at runtime!)';
              }
            }
          },
          {
            name: 'declares all seven steps',
            run: function (c) {
              var m = c.clean.match(/interface\s+SandwichBuilder\s*\{([\s\S]*?)\n\}/);
              if (!m) return 'Could not read the interface body.';
              var missing = ['reset', 'setBread', 'addDeck', 'setCheese', 'addTopping', 'toast', 'build']
                .filter(function (n) { return !(new RegExp(n + '\\s*\\(')).test(m[1]); });
              if (missing.length) return 'Missing method(s): ' + missing.join(', ');
            }
          },
          {
            name: 'fluent steps return `this`, build() returns Sandwich',
            run: function (c) {
              var m = c.clean.match(/interface\s+SandwichBuilder\s*\{([\s\S]*?)\n\}/);
              if (!m) return 'Could not read the interface body.';
              var thisCount = (m[1].match(/\)\s*:\s*this\b/g) || []).length;
              var buildOk = /build\s*\(\s*\)\s*:\s*Sandwich\b/.test(m[1]);
              if (thisCount < 6 || !buildOk) {
                return 'Six steps should return `this` (found ' + thisCount + '); ' +
                  'build() should return Sandwich.';
              }
            }
          }
        ]
      },

      {
        title: 'The Concrete Builder',
        chip: 'blog: Dissection → Concrete Builder',
        body:
          '<p>Now the real deli counter: ' +
          '<code>class DeliSandwichBuilder implements SandwichBuilder</code>. It holds one ' +
          'in-progress <code>Sandwich</code> in a private field. <b>This one is all yours</b> — two ' +
          'rules:</p><ul>' +
          '<li>Every step mutates the in-progress sandwich and <code>return this;</code></li>' +
          '<li><code>build()</code> hands over the finished sandwich, then resets — a builder is ' +
            '<i>reusable</i>, one instance can make order after order</li></ul>' +
          '<details class="hint"><summary>Hint 1 — one method as a template</summary>' +
          '<pre class="snippet">setBread(bread: Bread): this {\n' +
          '  this.sandwich.bread = bread;\n' +
          '  return this;\n' +
          '}</pre>' +
          '<p class="why">The other steps follow the same shape. <code>addDeck()</code> does ' +
          '<code>this.sandwich.decks += 1</code>.</p></details>' +
          '<details class="hint"><summary>Hint 2 — the build/reset dance</summary>' +
          '<pre class="snippet">build(): Sandwich {\n' +
          '  const order = this.sandwich;\n' +
          '  this.reset();\n' +
          '  return order;\n' +
          '}</pre></details>' +
          '<p><b>Checkpoint</b> — a customer with opinions:</p>' +
          '<pre class="snippet">const builder = new DeliSandwichBuilder();\n' +
          'const custom = builder.setBread(\'rye\').addDeck().addTopping(\'pastrami\').build();\n' +
          'console.log(custom);</pre>' +
          '<div class="expected">Sandwich { bread: \'rye\', decks: 2, cheese: null, toppings: [ \'pastrami\' ], toasted: false }</div>',
        checks: [
          {
            name: 'DeliSandwichBuilder implements SandwichBuilder',
            run: function (c) {
              var declared = /class\s+DeliSandwichBuilder\s+implements\s+SandwichBuilder\b/.test(c.clean);
              if (!declared || typeof c.g.DeliSandwichBuilder !== 'function') {
                return 'Declare `class DeliSandwichBuilder implements SandwichBuilder`.';
              }
            }
          },
          {
            name: 'steps are fluent (each returns the builder itself)',
            run: function (c) {
              var b = new c.g.DeliSandwichBuilder();
              if (!(b.setBread('white') === b && b.addDeck() === b && b.toast() === b)) {
                return 'Each step must `return this;` — the very same builder instance.';
              }
            }
          },
          {
            name: 'the pastrami-on-rye order comes out right',
            run: function (c) {
              var got = new c.g.DeliSandwichBuilder()
                .setBread('rye').addDeck().addTopping('pastrami').build();
              return wrong(got, c.expect.custom);
            }
          },
          {
            name: 'build() resets — the builder is reusable',
            run: function (c) {
              var b = new c.g.DeliSandwichBuilder();
              b.setBread('rye').addTopping('mustard').toast().build();
              var msg = wrong(b.build(), c.expect.plain);
              if (msg) {
                return 'After build(), the next build() should be a fresh default sandwich — ' + msg +
                  ' (build() should hand over the sandwich, then reset().)';
              }
            }
          }
        ]
      },

      {
        title: 'The Director',
        chip: 'blog: Dissection → Director',
        body:
          '<p>The <b>Director</b> knows the <i>recipes</i>: which steps, in which order. It works ' +
          'against the <code>SandwichBuilder</code> interface — it must never mention ' +
          '<code>DeliSandwichBuilder</code>. Ours is a <code>SandwichArtist</code>.</p>' +
          '<p><b>Write</b> a <code>SandwichArtist</code> class that takes a ' +
          '<code>SandwichBuilder</code> in its constructor and offers two menu items (each recipe ' +
          'should <code>reset()</code> first):</p><ul>' +
          '<li><code>makeGrilledCheese(): Sandwich</code> — white bread, cheddar, toasted</li>' +
          '<li><code>makeClubSandwich(): Sandwich</code> — wheat, one extra deck, swiss, turkey ' +
            'topping, bacon topping, toasted</li></ul>' +
          '<p class="why">⚠ Node trap: <code>constructor(private builder: SandwichBuilder)</code> is ' +
          'a "parameter property" — it won\'t survive Node\'s type stripping. Declare the field, then ' +
          'assign it in the constructor body. The checker enforces this.</p>' +
          '<details class="hint"><summary>Hint — constructor shape</summary>' +
          '<pre class="snippet">private builder: SandwichBuilder;\n\n' +
          'constructor(builder: SandwichBuilder) {\n' +
          '  this.builder = builder;\n' +
          '}</pre></details>' +
          '<p><b>Checkpoint:</b></p>' +
          '<pre class="snippet">const artist = new SandwichArtist(builder);\n' +
          'console.log(artist.makeGrilledCheese());\n' +
          'console.log(artist.makeClubSandwich());</pre>' +
          '<div class="expected">Sandwich { bread: \'white\', decks: 1, cheese: \'cheddar\', toppings: [], toasted: true }\n' +
          'Sandwich { bread: \'wheat\', decks: 2, cheese: \'swiss\', toppings: [ \'turkey\', \'bacon\' ], toasted: true }</div>',
        checks: [
          {
            name: 'class SandwichArtist exists',
            run: function (c) {
              if (typeof c.g.SandwichArtist !== 'function') return 'No SandwichArtist class found yet.';
            }
          },
          {
            name: 'no constructor parameter properties (Node trap)',
            run: function (c) {
              if (/constructor\s*\(\s*(?:private|public|protected|readonly)\b/.test(c.clean)) {
                return '`constructor(private builder: ...)` won\'t survive Node\'s type stripping. ' +
                  'Declare the field, assign in the constructor body.';
              }
            }
          },
          {
            name: 'makeGrilledCheese() recipe',
            run: function (c) {
              var got = new c.g.SandwichArtist(new c.g.DeliSandwichBuilder()).makeGrilledCheese();
              var msg = wrong(got, c.expect.grilledCheese);
              if (msg) return msg + ' (Recipe: reset, white bread, cheddar, toasted.)';
            }
          },
          {
            name: 'makeClubSandwich() recipe',
            run: function (c) {
              var got = new c.g.SandwichArtist(new c.g.DeliSandwichBuilder()).makeClubSandwich();
              var msg = wrong(got, c.expect.club);
              if (msg) return msg + ' (Recipe: reset, wheat, one extra deck, swiss, turkey, bacon, toasted.)';
            }
          }
        ]
      },

      {
        title: 'Usage — two ways to order',
        chip: 'blog: Usage',
        body:
          '<p>You already have both usage modes in your file — make sure all four ' +
          '<code>console.log</code> lines from the checkpoints are present and run together:</p><ul>' +
          '<li><b>Client drives the builder directly</b> — the custom pastrami-on-rye. Flexible, ' +
            'reads like a sentence.</li>' +
          '<li><b>Director drives the builder</b> — the menu. Recipes live in one place; callers ' +
            'can\'t get them wrong.</li></ul>' +
          '<p class="why">Per the GoF and ' +
          '<a href="https://refactoring.guru/design-patterns/builder" target="_blank">' +
          'Refactoring.Guru</a>, the Director is <i>optional</i> — client code may call the steps ' +
          'itself. Worth saying in your post.</p>' +
          '<p><b>Also try it for real:</b> <code>node sandbox/builder-pattern.ts</code> in the blog ' +
          'repo (if you\'ve been working in the in-page editor, paste your code into the sandbox file ' +
          'first).</p>',
        checks: [
          {
            name: 'four sandwiches logged',
            run: function (c) {
              if (c.logs.length < 4) {
                return 'Expected four console.log lines — the default sandwich, the custom order, ' +
                  'and the two menu items. Found ' + c.logs.length + '.';
              }
            }
          },
          {
            name: 'both usage modes are exercised',
            run: function (c) {
              var all = c.logs.join('\n');
              var missing = [];
              if (all.indexOf('pastrami') === -1) missing.push('the custom pastrami order (client-driven)');
              if (all.indexOf('cheddar') === -1) missing.push('makeGrilledCheese() (director-driven)');
              if (all.indexOf('turkey') === -1) missing.push('makeClubSandwich() (director-driven)');
              if (missing.length) return 'Not logged yet: ' + missing.join(', ') + '.';
            }
          }
        ]
      }
    ],

    quiz: [
      {
        q: 'In a fluent builder, every configuration step returns…',
        options: ['the builder itself', 'the finished product', 'a fresh sandwich', 'the void type'],
        answer: 0,
        explain: 'Returning <code>this</code> is what lets calls chain. Only <code>build()</code> ' +
          'hands over the product.'
      },
      {
        q: 'Which role owns the <i>order</i> of steps for a standard recipe?',
        options: ['the builder', 'the product', 'the director', 'the client'],
        answer: 2,
        explain: 'Builders know <i>how</i> to do each step; the director (your SandwichArtist) knows ' +
          '<i>which</i> steps in <i>what</i> order. Clients may also drive steps directly — the ' +
          'director is optional.'
      },
      {
        q: 'The Builder pattern earns its keep when a class has…',
        options: ['one global shared instance', 'many optional construction knobs',
                  'too many child classes', 'no public constructor available'],
        answer: 1,
        explain: 'The escape from telescoping constructors. ("One global shared instance" is the ' +
          'Singleton — your published post.)'
      }
    ]
  });
})();
