/**
 * Exercise 0002 — Strategy pattern, shipping-rates edition.
 *
 * Content only: prose, expectations, checks, quiz. The extension supplies the
 * lesson panel and the gating; VS Code supplies the editor and type-checking.
 *
 * Every quote is a whole number of dollars on purpose: the lesson is swapping
 * algorithms, not floating-point arithmetic, and integers make the expected
 * values exact.
 */
'use strict';

/** A fresh parcel each time, so a strategy that mutates its input can't poison later checks. */
function parcel(c, which) {
  var p = c.expect.parcels[which];
  return { weightKg: p.weightKg, distanceKm: p.distanceKm };
}

/** Compare one quote against the expected figure. Returns a message, or null when it matches. */
function off(got, want, label) {
  if (typeof got !== 'number' || !isFinite(got)) {
    return 'Quoting ' + label + ' should return a number but returned ' + JSON.stringify(got) + '.';
  }
  if (got !== want) return 'Quoting ' + label + ' should be ' + want + ' but was ' + got + '.';
  return null;
}

/** Both parcels, against one expected pair. */
function quotesWrong(c, strategy, want) {
  return off(strategy.quote(parcel(c, 'books')), want.books, 'the 2 kg / 50 km parcel') ||
    off(strategy.quote(parcel(c, 'desk')), want.desk, 'the 10 kg / 400 km parcel');
}

module.exports = {
    meta: {
      id: 'strategy',
      number: '0002',
      title: 'The Strategy Pattern',
      heading: 'Swap the algorithm, not the caller',
      emoji: '📦',
      domain: 'Shipping rates',
      category: 'Behavioral',
      blurb: 'Price a parcel three different ways with no branching in the caller. Strategy, ' +
             'Concrete Strategy, Context — plus the TypeScript twist: a strategy can just be a function.',
      missionNote: '<b>Mission tie-in:</b> what you write here becomes the <i>Example</i> and ' +
        '<i>Dissection</i> sections of <code>docs/posts/drafts/strategy-pattern.md</code> in the blog ' +
        'repo. Builder was about <i>constructing</i> one object; Strategy is your first pattern about ' +
        '<i>swapping behaviour</i> at run time.',
      howto: 'Write your code in <code>strategy.ts</code> beside this panel. Every save re-runs the ' +
        'checks, or press <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Enter</kbd>. Type errors come from ' +
        'VS Code itself — if it\'s underlined in the editor, fix that first. You can also run the ' +
        'file directly: <code>node strategy/strategy.ts</code>.',
      primarySource: {
        url: 'https://refactoring.guru/design-patterns/strategy',
        label: 'Strategy — Refactoring.Guru',
        note: '(roles, and why the client picks the strategy). Canonical reference: ' +
              '<i>Design Patterns</i>, Gamma, Helm, Johnson &amp; Vlissides (1994).'
      },
      references: [
        { name: 'strategy-pattern.md', label: 'Strategy cheat sheet' },
        { name: 'design-patterns-glossary.md', label: 'Design-patterns glossary' }
      ],
      finale: '🎉 <b>All four roles built.</b>' +
        '<p><b>Try it out.</b> One checkout, three prices, and not one <code>if</code> asking which ' +
        'shipping method this is:</p>' +
        '<pre class="snippet">const desk: Parcel = { weightKg: 10, distanceKm: 400 };\n' +
        'const checkout = new Checkout(new StandardShipping());\n' +
        'console.log(checkout.quote(desk));\n\n' +
        'checkout.setStrategy(new OvernightShipping());\n' +
        'console.log(checkout.quote(desk));\n\n' +
        'checkout.setStrategy(asStrategy(() =&gt; 0));   // free-shipping promo\n' +
        'console.log(checkout.quote(desk));</pre>' +
        '<p>Run it: <code>node strategy/strategy.ts</code>. Now add a fourth rate without touching ' +
        '<code>Checkout</code> at all — that is the whole return on the pattern.</p>' +
        '<p><b>To make it stick:</b></p>' +
        '<ul style="margin:8px 0 0; padding-left:18px;">' +
        '<li><b>Now:</b> draft the <i>Dissection</i> section of your post from memory, one heading ' +
          'per role — then check back against your code.</li>' +
        '<li><b>Next:</b> write down the <code>switch</code> statement your <code>Checkout</code> ' +
          'would have needed instead. That is the smell Strategy removes, and it belongs in your ' +
          '<i>Introduction</i>.</li>' +
        '<li><b>In ~2 days:</b> rebuild the file cold. Spaced retrieval beats rereading.</li>' +
        '<li><b>Then:</b> tell Claude you\'re done — I\'ll review your code against the pattern ' +
          'and help outline the post.</li></ul>'
    },

    // Types and interfaces are erased at runtime, so only the classes and the
    // helper function can be lifted out; the rest is checked against the source.
    captures: ['StandardShipping', 'OvernightShipping', 'Checkout', 'asStrategy'],

    // Two parcels and what each rate should charge for them. Whole dollars.
    //   standard  = 5 + 2 per kg
    //   overnight = 12 + 3 per kg, plus 25 when distanceKm > 100
    expected: {
      parcels: {
        books: { weightKg: 2,  distanceKm: 50 },
        desk:  { weightKg: 10, distanceKm: 400 }
      },
      standard:  { books: 9,  desk: 25 },
      overnight: { books: 18, desk: 67 },
      promo: 0
    },

    scaffold: [
      '/**',
      ' * THE STRATEGY PATTERN - shipping-rates edition',
      ' * Follow the steps in the left panel. Run checks: Ctrl+Alt+Enter.',
      ' */',
      '',
      '// -- STEP 1 - STRATEGY -----------------------------------------',
      '',
      '',
      '// -- STEP 2 - CONCRETE STRATEGIES ------------------------------',
      '',
      '',
      '// -- STEP 3 - CONTEXT ------------------------------------------',
      '',
      '',
      '// -- STEP 4 - FUNCTION AS STRATEGY -----------------------------',
      '',
      ''
    ].join('\n'),

    steps: [
      {
        title: 'The Strategy interface',
        chip: 'blog: Dissection → Strategy',
        body:
          '<p>A checkout has to price shipping, and there are several ways to do it. The obvious ' +
          'version grows a branch per method:</p>' +
          '<pre class="snippet">if (method === \'standard\') { /* … */ }\n' +
          'else if (method === \'overnight\') { /* … */ }\n' +
          'else if (method === \'promo\') { /* … */ }</pre>' +
          '<p>Every new rate edits that function, and the caller ends up owning arithmetic it has no ' +
          'business knowing. <b>Strategy</b> turns each branch into its own object behind a shared ' +
          'interface.</p>' +
          '<p>Start with the two declarations everything else leans on. <b>Write:</b></p><ul>' +
          '<li><code>type Parcel = { weightKg: number; distanceKm: number }</code> — what gets ' +
            'priced. A plain object type; no class needed.</li>' +
          '<li><code>interface ShippingStrategy</code> with exactly one member: ' +
            '<code>quote(parcel: Parcel): number</code></li></ul>' +
          '<p class="why">One method is normal here. The <b>Strategy</b> role is the contract for ' +
          '<i>one interchangeable algorithm</i> — the narrower it is, the easier a new rate is to ' +
          'add. Note what it does <i>not</i> take: no method name, no flag. The choice of algorithm ' +
          'is made by picking an object, not by passing a value.</p>' +
          '<p><b>Checkpoint:</b> run checks. Nothing to log yet — a type and an interface are both ' +
          'erased at compile time, so this step is verified by reading your <i>source text</i>. ' +
          'There is nothing left of either one at runtime.</p>',
        checks: [
          {
            name: 'type Parcel declared, with both measurements',
            run: function (c) {
              if (!/type\s+Parcel\b/.test(c.clean)) {
                return 'Declare `type Parcel = { weightKg: number; distanceKm: number }`. (Types are ' +
                  'erased at compile time, so this check reads your source text.)';
              }
              var missing = ['weightKg', 'distanceKm'].filter(function (f) {
                return !(new RegExp('\\b' + f + '\\s*:\\s*number')).test(c.clean);
              });
              if (missing.length) return 'Parcel is missing: ' + missing.join(', ') + ' (both `number`).';
            }
          },
          {
            name: 'interface ShippingStrategy declares quote(): number',
            run: function (c) {
              if (!/interface\s+ShippingStrategy\b/.test(c.clean)) {
                return 'Declare `interface ShippingStrategy { quote(parcel: Parcel): number; }`.';
              }
              var m = c.clean.match(/interface\s+ShippingStrategy\s*\{([\s\S]*?)\}/);
              if (!m) return 'Could not read the interface body.';
              if (!/quote\s*\([^)]*\)\s*:\s*number/.test(m[1])) {
                return 'ShippingStrategy needs `quote(parcel: Parcel): number` — a price out, ' +
                  'a parcel in.';
              }
            }
          }
        ]
      },

      {
        title: 'Concrete Strategies',
        chip: 'blog: Dissection → Concrete Strategy',
        body:
          '<p>Now the algorithms themselves. Each is a class that <code>implements ' +
          'ShippingStrategy</code> and does nothing else. <b>Write both:</b></p><ul>' +
          '<li><code>StandardShipping</code> — <b>$5</b> flat, plus <b>$2 per kg</b>. Distance ' +
            'doesn\'t matter.</li>' +
          '<li><code>OvernightShipping</code> — <b>$12</b> flat, plus <b>$3 per kg</b>, plus a ' +
            '<b>$25</b> long-haul surcharge when <code>distanceKm</code> is over 100.</li></ul>' +
          '<p class="why">The two rates read different fields of the same parcel, and that is fine: ' +
          'each <b>Concrete Strategy</b> owns its algorithm outright. They share an interface, not an ' +
          'implementation — no base class, nothing to inherit. Keep them stateless; everything they ' +
          'need arrives as the argument.</p>' +
          '<details class="hint"><summary>Hint — the shape of one</summary>' +
          '<pre class="snippet">class StandardShipping implements ShippingStrategy {\n' +
          '  quote(parcel: Parcel): number {\n' +
          '    return 5 + 2 * parcel.weightKg;\n' +
          '  }\n' +
          '}</pre>' +
          '<p class="why">Overnight follows the same shape, with a surcharge to work out first.</p>' +
          '</details>' +
          '<p><b>Checkpoint</b> — the same parcel, priced twice:</p>' +
          '<pre class="snippet">const books: Parcel = { weightKg: 2, distanceKm: 50 };\n' +
          'console.log(new StandardShipping().quote(books));\n' +
          'console.log(new OvernightShipping().quote(books));</pre>' +
          '<div class="expected">9\n18</div>',
        checks: [
          {
            name: 'both strategies implement ShippingStrategy',
            run: function (c) {
              var names = ['StandardShipping', 'OvernightShipping'];
              for (var i = 0; i < names.length; i++) {
                var n = names[i];
                var declared = new RegExp('class\\s+' + n + '\\s+implements\\s+ShippingStrategy\\b')
                  .test(c.clean);
                if (!declared || typeof c.g[n] !== 'function') {
                  return 'Declare `class ' + n + ' implements ShippingStrategy`.';
                }
              }
            }
          },
          {
            name: 'StandardShipping: $5 + $2/kg',
            run: function (c) {
              var msg = quotesWrong(c, new c.g.StandardShipping(), c.expect.standard);
              if (msg) return msg + ' (Standard is $5 flat plus $2 per kg; distance is ignored.)';
            }
          },
          {
            name: 'OvernightShipping: $12 + $3/kg, +$25 over 100 km',
            run: function (c) {
              var msg = quotesWrong(c, new c.g.OvernightShipping(), c.expect.overnight);
              if (msg) {
                return msg + ' (Overnight is $12 flat plus $3 per kg, plus $25 when distanceKm > 100 — ' +
                  'the 50 km parcel pays no surcharge, the 400 km one does.)';
              }
            }
          }
        ]
      },

      {
        title: 'The Context',
        chip: 'blog: Dissection → Context',
        body:
          '<p>The <b>Context</b> is the class your application actually talks to. It holds a strategy ' +
          'and delegates to it — it never implements a rate itself, and it never mentions a concrete ' +
          'one by name. Ours is a <code>Checkout</code>.</p>' +
          '<p><b>Write</b> a <code>Checkout</code> class with:</p><ul>' +
          '<li>a private field holding a <code>ShippingStrategy</code></li>' +
          '<li>a constructor taking a <code>ShippingStrategy</code></li>' +
          '<li><code>setStrategy(strategy: ShippingStrategy): void</code> — swap it out</li>' +
          '<li><code>quote(parcel: Parcel): number</code> — delegate to the current strategy</li></ul>' +
          '<p class="why">Both the constructor and the setter are typed to the <i>interface</i>. That ' +
          'is what makes a fourth rate a new file rather than an edit here. And notice who is missing ' +
          'from this step: nothing in <code>Checkout</code> decides <i>which</i> rate applies. Per the ' +
          '<a href="https://refactoring.guru/design-patterns/strategy" target="_blank">GoF and ' +
          'Refactoring.Guru</a>, that call belongs to the <b>client</b>.</p>' +
          '<p class="why">⚠ Node trap: <code>constructor(private strategy: ShippingStrategy)</code> is ' +
          'a "parameter property" — it won\'t survive Node\'s type stripping. Declare the field, then ' +
          'assign it in the constructor body. The checker enforces this.</p>' +
          '<details class="hint"><summary>Hint — constructor shape</summary>' +
          '<pre class="snippet">private strategy: ShippingStrategy;\n\n' +
          'constructor(strategy: ShippingStrategy) {\n' +
          '  this.strategy = strategy;\n' +
          '}</pre></details>' +
          '<p><b>Checkpoint</b> — one checkout, one parcel, two prices:</p>' +
          '<pre class="snippet">const desk: Parcel = { weightKg: 10, distanceKm: 400 };\n' +
          'const checkout = new Checkout(new StandardShipping());\n' +
          'console.log(checkout.quote(desk));\n\n' +
          'checkout.setStrategy(new OvernightShipping());\n' +
          'console.log(checkout.quote(desk));</pre>' +
          '<div class="expected">25\n67</div>',
        checks: [
          {
            name: 'class Checkout exists',
            run: function (c) {
              if (typeof c.g.Checkout !== 'function') return 'No Checkout class found yet.';
            }
          },
          {
            name: 'no constructor parameter properties (Node trap)',
            run: function (c) {
              if (/constructor\s*\(\s*(?:private|public|protected|readonly)\b/.test(c.clean)) {
                return '`constructor(private strategy: ...)` won\'t survive Node\'s type stripping. ' +
                  'Declare the field, assign in the constructor body.';
              }
            }
          },
          {
            name: 'constructor and setStrategy() both take the interface',
            run: function (c) {
              if (!/constructor\s*\(\s*\w+\s*:\s*ShippingStrategy\b/.test(c.clean)) {
                return 'The constructor should take a `ShippingStrategy`, not a concrete rate — ' +
                  'that is what lets a new rate arrive without editing Checkout.';
              }
              if (!/setStrategy\s*\(\s*\w+\s*:\s*ShippingStrategy\b/.test(c.clean)) {
                return 'Add `setStrategy(strategy: ShippingStrategy): void`, typed to the interface.';
              }
            }
          },
          {
            name: 'quote() delegates to the strategy it was given',
            run: function (c) {
              var checkout = new c.g.Checkout(new c.g.StandardShipping());
              var msg = off(checkout.quote(parcel(c, 'desk')), c.expect.standard.desk,
                'the 10 kg / 400 km parcel');
              if (msg) return msg + ' (Checkout.quote() should return this.strategy.quote(parcel).)';
            }
          },
          {
            name: 'setStrategy() changes the answer — same checkout, new rate',
            run: function (c) {
              var checkout = new c.g.Checkout(new c.g.StandardShipping());
              checkout.quote(parcel(c, 'desk'));
              if (typeof checkout.setStrategy !== 'function') return 'No setStrategy() method found.';
              checkout.setStrategy(new c.g.OvernightShipping());
              var msg = off(checkout.quote(parcel(c, 'desk')), c.expect.overnight.desk,
                'the 10 kg / 400 km parcel after the swap');
              if (msg) {
                return msg + ' (setStrategy() should replace the stored strategy, so the very next ' +
                  'quote uses the new rate.)';
              }
            }
          }
        ]
      },

      {
        title: 'A function as a strategy',
        chip: 'blog: Dissection → Function as Strategy',
        body:
          '<p><code>ShippingStrategy</code> has one method, so a plain function carries exactly the ' +
          'same information — and TypeScript\'s structural typing means the two are interchangeable ' +
          'without any ceremony. <b>Write:</b></p><ul>' +
          '<li><code>type QuoteFn = (parcel: Parcel) =&gt; number</code></li>' +
          '<li><code>function asStrategy(quote: QuoteFn): ShippingStrategy</code> — returns an object ' +
            'wrapping that function</li></ul>' +
          '<details class="hint"><summary>Hint — it really is this short</summary>' +
          '<pre class="snippet">return { quote };</pre>' +
          '<p class="why">An object literal with a <code>quote</code> property <i>is</i> a ' +
          '<code>ShippingStrategy</code>. No <code>class</code>, no <code>implements</code> — ' +
          'TypeScript checks the shape, not the declared lineage.</p></details>' +
          '<p class="why">This is the pragmatic form you will meet most often in TypeScript, and it ' +
          'is worth its own heading in your post: for a one-method strategy, the class is optional ' +
          'scaffolding. Keep classes when a rate needs configuration or a name to log; reach for a ' +
          'function when it is one expression.</p>' +
          '<p><b>Checkpoint</b> — a free-shipping promo, with no class at all:</p>' +
          '<pre class="snippet">checkout.setStrategy(asStrategy(() =&gt; 0));\n' +
          'console.log(checkout.quote(desk));</pre>' +
          '<div class="expected">0</div>',
        checks: [
          {
            name: 'type QuoteFn declared as a function type',
            run: function (c) {
              if (!/type\s+QuoteFn\s*=\s*\(/.test(c.clean)) {
                return 'Declare `type QuoteFn = (parcel: Parcel) => number`.';
              }
              if (!/type\s+QuoteFn\s*=\s*\([^)]*\)\s*=>\s*number/.test(c.clean)) {
                return 'QuoteFn should take a Parcel and return a number.';
              }
            }
          },
          {
            name: 'asStrategy() wraps a function into a ShippingStrategy',
            run: function (c) {
              if (typeof c.g.asStrategy !== 'function') return 'No asStrategy() function found yet.';
              var s = c.g.asStrategy(function (p) { return p.weightKg; });
              if (!s || typeof s.quote !== 'function') {
                return 'asStrategy() should return an object with a quote() method — ' +
                  '`return { quote };` is the whole body.';
              }
              return off(s.quote(parcel(c, 'books')), c.expect.parcels.books.weightKg,
                'a strategy built from (parcel) => parcel.weightKg');
            }
          },
          {
            name: 'the Context accepts one without knowing the difference',
            run: function (c) {
              var checkout = new c.g.Checkout(new c.g.StandardShipping());
              checkout.setStrategy(c.g.asStrategy(function () { return 0; }));
              var msg = off(checkout.quote(parcel(c, 'desk')), c.expect.promo,
                'the promo parcel');
              if (msg) {
                return msg + ' (A wrapped function is a ShippingStrategy like any other — Checkout ' +
                  'cannot tell it apart from a class.)';
              }
            }
          }
        ]
      }
    ],

    quiz: [
      {
        q: 'Changing the algorithm at run time is done by…',
        options: ['giving the context a new strategy', 'subclassing the context per case',
                  'branching inside the context method', 'rebuilding the context from scratch'],
        answer: 0,
        explain: 'The context holds one strategy and delegates. Swapping the object is the whole ' +
          'mechanism — the branch you would otherwise write is what the pattern removes.'
      },
      {
        q: 'Which role decides <i>which</i> concrete strategy to use?',
        options: ['the client chooses it', 'the context chooses it',
                  'the strategy chooses it', 'the interface chooses it'],
        answer: 0,
        explain: 'The client picks the strategy and hands it over; the context only knows the ' +
          'interface. A context that chooses is back to branching on a flag.'
      },
      {
        q: 'In TypeScript, a one-method strategy can collapse into…',
        options: ['a plain function type', 'an abstract base class',
                  'a static utility class', 'an enum of choices'],
        answer: 0,
        explain: 'Structural typing means `{ quote }` satisfies the interface, so ' +
          '`(parcel) => number` carries the same contract. Keep the class when a rate needs state ' +
          'or a name.'
      }
    ]
};
