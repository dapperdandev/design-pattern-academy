/**
 * Exercise 0003 — Factory Method pattern, coffee-stand edition.
 *
 * Content only: prose, expectations, checks, quiz. The extension supplies the
 * lesson panel and the gating; VS Code supplies the editor and type-checking.
 *
 * The creator's own logic (a cups-served tally) is deliberately the smallest
 * thing that still justifies the role: if the creator did nothing but `new`, a
 * plain function would be the better answer and the exercise would be teaching
 * ceremony.
 */
'use strict';

var CUP_FIELDS = ['name', 'ounces', 'caffeineMg'];

/** Compare a cup against an expected field set. Returns a message, or null when it matches. */
function cupWrong(got, want, what) {
  if (!got || typeof got !== 'object') {
    return what + ' should return a cup object, but returned ' + JSON.stringify(got) + '.';
  }
  for (var i = 0; i < CUP_FIELDS.length; i++) {
    var k = CUP_FIELDS[i];
    if (got[k] !== want[k]) {
      return what + ': ' + k + ' should be ' + JSON.stringify(want[k]) +
        ' but was ' + JSON.stringify(got[k]) + '.';
    }
  }
  return null;
}

/**
 * A throwaway subclass of the learner's creator, built here in the check rather
 * than in the exercise file. It is what lets step 3 prove that serve() calls
 * this.brew() before the learner has written a single concrete creator.
 */
function probeStand(c) {
  var Stand = c.g.CoffeeStand;
  var made = [];
  var Probe = class extends Stand {
    brew() {
      var cup = { name: 'probe-' + made.length, ounces: 1, caffeineMg: 1 };
      made.push(cup);
      return cup;
    }
  };
  return { stand: new Probe(), made: made };
}

module.exports = {
    meta: {
      id: 'factory-method',
      number: '0003',
      title: 'The Factory Method Pattern',
      heading: 'Let the subclass decide what to make',
      emoji: '☕',
      domain: 'Coffee stands',
      category: 'Creational',
      blurb: 'One stand, two drinks, and a base class that serves a cup it never names. Product, ' +
             'Concrete Product, Creator, Concrete Creator.',
      missionNote: '<b>Mission tie-in:</b> what you write here becomes the <i>Example</i> and ' +
        '<i>Dissection</i> sections of <code>docs/posts/drafts/factory-method-pattern.md</code> in ' +
        'the blog repo. Builder assembled one object; Factory Method hands the <i>choice of class</i> ' +
        'to a subclass.',
      howto: 'Write your code in <code>factory-method.ts</code> beside this panel. Every save ' +
        're-runs the checks, or press <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Enter</kbd>. Type errors ' +
        'come from VS Code itself — if it\'s underlined in the editor, fix that first. You can also ' +
        'run the file directly: <code>node factory-method/factory-method.ts</code>.',
      primarySource: {
        url: 'https://refactoring.guru/design-patterns/factory-method',
        label: 'Factory Method — Refactoring.Guru',
        note: '(roles, and how it differs from a "simple factory"). Canonical reference: ' +
              '<i>Design Patterns</i>, Gamma, Helm, Johnson &amp; Vlissides (1994).'
      },
      references: [
        { name: 'factory-method-pattern.md', label: 'Factory Method cheat sheet' },
        { name: 'design-patterns-glossary.md', label: 'Design-patterns glossary' }
      ],
      finale: '🎉 <b>All four roles built.</b>' +
        '<p><b>Try it out.</b> The loop below never names a drink, and never asks which stand it is ' +
        'holding:</p>' +
        '<pre class="snippet">const stands: CoffeeStand[] = [new EspressoBar(), new ColdBrewCart()];\n\n' +
        'for (const stand of stands) {\n' +
        '  console.log(stand.serve());\n' +
        '}</pre>' +
        '<p>Run it: <code>node factory-method/factory-method.ts</code>. Then add a third stand and ' +
        'watch the loop pick it up untouched — that is the return on the pattern.</p>' +
        '<p><b>To make it stick:</b></p>' +
        '<ul style="margin:8px 0 0; padding-left:18px;">' +
        '<li><b>Now:</b> draft the <i>Dissection</i> section of your post from memory, one heading ' +
          'per role — then check back against your code.</li>' +
        '<li><b>Next:</b> answer this in your <i>Introduction</i>: what does the creator get that a ' +
          'plain <code>makeCoffee(kind)</code> function does not? (Look at what ' +
          '<code>serve()</code> does around the <code>brew()</code> call.)</li>' +
        '<li><b>In ~2 days:</b> rebuild the file cold. Spaced retrieval beats rereading.</li>' +
        '<li><b>Then:</b> tell Claude you\'re done — I\'ll review your code against the pattern ' +
          'and help outline the post.</li></ul>'
    },

    // The Coffee interface is erased at runtime, so step 1 is checked against
    // the source; everything below is a class and can be exercised directly.
    captures: ['Espresso', 'ColdBrew', 'CoffeeStand', 'EspressoBar', 'ColdBrewCart'],

    // What each concrete product should contain. Fields, not formatted text.
    expected: {
      espresso: { name: 'espresso',  ounces: 1,  caffeineMg: 64 },
      coldBrew: { name: 'cold brew', ounces: 12, caffeineMg: 200 }
    },

    scaffold: [
      '/**',
      ' * THE FACTORY METHOD PATTERN - coffee-stand edition',
      ' * Follow the steps in the left panel. Run checks: Ctrl+Alt+Enter.',
      ' */',
      '',
      '// -- STEP 1 - PRODUCT ------------------------------------------',
      '',
      '',
      '// -- STEP 2 - CONCRETE PRODUCTS --------------------------------',
      '',
      '',
      '// -- STEP 3 - CREATOR ------------------------------------------',
      '',
      '',
      '// -- STEP 4 - CONCRETE CREATORS --------------------------------',
      '',
      ''
    ].join('\n'),

    steps: [
      {
        title: 'The Product interface',
        chip: 'blog: Dissection → Product',
        body:
          '<p>The <b>Product</b> is what gets created — but as an <i>interface</i>, not a class. That ' +
          'is the point of the whole pattern: every other role deals in this type, so nobody has to ' +
          'name a concrete drink.</p>' +
          '<p><b>Write</b> <code>interface Coffee</code> with three members:</p><ul>' +
          '<li><code>name: string</code></li>' +
          '<li><code>ounces: number</code></li>' +
          '<li><code>caffeineMg: number</code></li></ul>' +
          '<p class="why">Data only — no <code>prepare()</code>, no <code>describe()</code>. A ' +
          'product needs behaviour only when the domain gives it some, and inventing a method here ' +
          'would teach you nothing about creation.</p>' +
          '<p><b>Checkpoint:</b> run checks. Nothing to log yet — an interface is erased at compile ' +
          'time, so this step is verified by reading your <i>source text</i>.</p>',
        checks: [
          {
            name: 'interface Coffee declared, with all three members',
            run: function (c) {
              if (!/interface\s+Coffee\b/.test(c.clean)) {
                return 'Declare `interface Coffee { name: string; ounces: number; caffeineMg: number; }`. ' +
                  '(Interfaces are erased at compile time, so this check reads your source text — ' +
                  'there is nothing left of one at runtime!)';
              }
              var m = c.clean.match(/interface\s+Coffee\s*\{([\s\S]*?)\}/);
              if (!m) return 'Could not read the interface body.';
              var missing = ['name', 'ounces', 'caffeineMg'].filter(function (f) {
                return !(new RegExp('\\b' + f + '\\s*:')).test(m[1]);
              });
              if (missing.length) return 'Coffee is missing: ' + missing.join(', ');
            }
          }
        ]
      },

      {
        title: 'Concrete Products',
        chip: 'blog: Dissection → Concrete Product',
        body:
          '<p>Two drinks, each a class that <code>implements Coffee</code> with its values baked in. ' +
          '<b>Write both:</b></p><ul>' +
          '<li><code>Espresso</code> — <code>\'espresso\'</code>, 1 oz, 64 mg</li>' +
          '<li><code>ColdBrew</code> — <code>\'cold brew\'</code>, 12 oz, 200 mg</li></ul>' +
          '<details class="hint"><summary>Hint — the shape of one</summary>' +
          '<pre class="snippet">class Espresso implements Coffee {\n' +
          '  name = \'espresso\';\n' +
          '  ounces = 1;\n' +
          '  caffeineMg = 64;\n' +
          '}</pre>' +
          '<p class="why">Field initializers, no constructor: there is nothing to pass in. ' +
          'TypeScript infers <code>string</code> and <code>number</code>, which is exactly what ' +
          '<code>Coffee</code> asks for.</p></details>' +
          '<p class="why">These are the only two places in the file where a concrete drink is ' +
          'spelled out. Everything from here on says <code>Coffee</code>.</p>' +
          '<p><b>Checkpoint:</b></p>' +
          '<pre class="snippet">console.log(new Espresso());\n' +
          'console.log(new ColdBrew());</pre>' +
          '<div class="expected">Espresso { name: \'espresso\', ounces: 1, caffeineMg: 64 }\n' +
          'ColdBrew { name: \'cold brew\', ounces: 12, caffeineMg: 200 }</div>',
        checks: [
          {
            name: 'both drinks implement Coffee',
            run: function (c) {
              var names = ['Espresso', 'ColdBrew'];
              for (var i = 0; i < names.length; i++) {
                var n = names[i];
                var declared = new RegExp('class\\s+' + n + '\\s+implements\\s+Coffee\\b').test(c.clean);
                if (!declared || typeof c.g[n] !== 'function') {
                  return 'Declare `class ' + n + ' implements Coffee`.';
                }
              }
            }
          },
          {
            name: 'each drink carries its own values',
            run: function (c) {
              return cupWrong(new c.g.Espresso(), c.expect.espresso, 'new Espresso()') ||
                cupWrong(new c.g.ColdBrew(), c.expect.coldBrew, 'new ColdBrew()');
            }
          }
        ]
      },

      {
        title: 'The Creator',
        chip: 'blog: Dissection → Creator',
        body:
          '<p>Here is the role that gives the pattern its name. The <b>Creator</b> declares a ' +
          '<i>factory method</i> it does not implement, and then uses it. <b>Write</b> ' +
          '<code>abstract class CoffeeStand</code> with:</p><ul>' +
          '<li><code>cupsServed = 0</code></li>' +
          '<li><code>abstract brew(): Coffee;</code> — the <b>factory method</b>. No body: this ' +
            'class does not know what it sells.</li>' +
          '<li><code>serve(): Coffee</code> — calls <code>this.brew()</code>, adds one to ' +
            '<code>cupsServed</code>, returns the cup</li></ul>' +
          '<p class="why">Read <code>serve()</code> again: it is ordinary logic every stand ' +
          'inherits, wrapped around a creation step it delegates. <i>That</i> is why the Creator is ' +
          'a class and not a <code>makeCoffee(kind)</code> function — the function has nowhere to ' +
          'put the tally, and no way to be extended without editing it.</p>' +
          '<p class="why">⚠ <code>abstract</code> is a type-level word only. It survives Node\'s ' +
          'stripping (the modifier and the bodiless method both vanish), so ' +
          '<code>new CoffeeStand()</code> would happily <i>run</i> — only the type-checker stops ' +
          'you. Same lesson as <code>readonly</code> in Builder: types are gone at runtime, which is ' +
          'why this panel refuses to grade behaviour until the editor is clean.</p>' +
          '<details class="hint"><summary>Hint — serve()</summary>' +
          '<pre class="snippet">serve(): Coffee {\n' +
          '  const cup = this.brew();\n' +
          '  this.cupsServed++;\n' +
          '  return cup;\n' +
          '}</pre></details>' +
          '<p><b>Checkpoint:</b> run checks. Nothing to instantiate yet — an abstract class needs a ' +
          'subclass, which is step 4. The checker builds a throwaway one of its own to test your ' +
          '<code>serve()</code>.</p>',
        checks: [
          {
            name: 'abstract class CoffeeStand declares an abstract brew()',
            run: function (c) {
              if (!/abstract\s+class\s+CoffeeStand\b/.test(c.clean)) {
                return 'Declare `abstract class CoffeeStand`.';
              }
              if (!/abstract\s+brew\s*\(\s*\)\s*:\s*Coffee\b/.test(c.clean)) {
                return 'Declare the factory method with no body: `abstract brew(): Coffee;`';
              }
              if (typeof c.g.CoffeeStand !== 'function') return 'No CoffeeStand class found yet.';
            }
          },
          {
            name: 'serve() calls this.brew() and hands back that cup',
            run: function (c) {
              var p = probeStand(c);
              if (typeof p.stand.serve !== 'function') return 'No serve() method on CoffeeStand yet.';
              var cup = p.stand.serve();
              if (p.made.length !== 1) {
                return 'serve() should call this.brew() exactly once (it called it ' +
                  p.made.length + ' times). The creator must not construct a drink itself.';
              }
              if (cup !== p.made[0]) {
                return 'serve() should return the very cup this.brew() produced.';
              }
            }
          },
          {
            name: 'cupsServed counts the cups',
            run: function (c) {
              var p = probeStand(c);
              if (p.stand.cupsServed !== 0) {
                return 'cupsServed should start at 0 but was ' + JSON.stringify(p.stand.cupsServed) + '.';
              }
              p.stand.serve();
              p.stand.serve();
              if (p.stand.cupsServed !== 2) {
                return 'After two serve() calls cupsServed should be 2 but was ' +
                  JSON.stringify(p.stand.cupsServed) + '. (This tally is the creator\'s own logic — ' +
                  'the reason it is a class and not a bare function.)';
              }
            }
          }
        ]
      },

      {
        title: 'Concrete Creators',
        chip: 'blog: Dissection → Concrete Creator',
        body:
          '<p>Each <b>Concrete Creator</b> overrides the factory method to return one concrete ' +
          'product — and that is <i>all</i> it does. <b>Write both:</b></p><ul>' +
          '<li><code>class EspressoBar extends CoffeeStand</code> — <code>brew()</code> returns a ' +
            'new <code>Espresso</code></li>' +
          '<li><code>class ColdBrewCart extends CoffeeStand</code> — <code>brew()</code> returns a ' +
            'new <code>ColdBrew</code></li></ul>' +
          '<p class="why">Note the return type: <code>brew(): Coffee</code>, not ' +
          '<code>brew(): Espresso</code>. Callers are promised a <code>Coffee</code>; narrowing the ' +
          'promise invites them to depend on the drink. Note also what neither class touches — ' +
          '<code>serve()</code> and <code>cupsServed</code> are inherited untouched.</p>' +
          '<p class="why">And <code>brew()</code> returns a <b>new</b> cup every call. A stored cup ' +
          'handed out twice is a different pattern (and a bug here) — two customers would share one ' +
          'drink.</p>' +
          '<p><b>Checkpoint:</b></p>' +
          '<pre class="snippet">const bar = new EspressoBar();\n' +
          'const cart = new ColdBrewCart();\n\n' +
          'console.log(bar.serve());\n' +
          'console.log(cart.serve());\n' +
          'console.log(bar.cupsServed, cart.cupsServed);</pre>' +
          '<div class="expected">Espresso { name: \'espresso\', ounces: 1, caffeineMg: 64 }\n' +
          'ColdBrew { name: \'cold brew\', ounces: 12, caffeineMg: 200 }\n' +
          '1 1</div>',
        checks: [
          {
            name: 'both stands extend CoffeeStand',
            run: function (c) {
              var names = ['EspressoBar', 'ColdBrewCart'];
              for (var i = 0; i < names.length; i++) {
                var n = names[i];
                if (typeof c.g[n] !== 'function') return 'No ' + n + ' class found yet.';
                if (!new RegExp('class\\s+' + n + '\\s+extends\\s+CoffeeStand\\b').test(c.clean)) {
                  return 'Declare `class ' + n + ' extends CoffeeStand`.';
                }
                if (!(new c.g[n]() instanceof c.g.CoffeeStand)) {
                  return n + ' should be a CoffeeStand — extend it rather than re-implementing it.';
                }
              }
            }
          },
          {
            name: 'brew() still promises a Coffee, not a concrete drink',
            run: function (c) {
              var m = c.clean.match(/brew\s*\(\s*\)\s*:\s*(Espresso|ColdBrew)\b/);
              if (m) {
                return 'One brew() is annotated `: ' + m[1] + '`. Keep the promise as ' +
                  '`brew(): Coffee` — narrowing it lets callers start depending on the drink, ' +
                  'which is the coupling the pattern exists to remove.';
              }
            }
          },
          {
            name: 'each brew() returns its own drink',
            run: function (c) {
              var bar = new c.g.EspressoBar();
              var cart = new c.g.ColdBrewCart();
              var msg = cupWrong(bar.brew(), c.expect.espresso, 'EspressoBar.brew()') ||
                cupWrong(cart.brew(), c.expect.coldBrew, 'ColdBrewCart.brew()');
              if (msg) return msg;
              if (!(bar.brew() instanceof c.g.Espresso)) {
                return 'EspressoBar.brew() should return `new Espresso()`.';
              }
              if (!(cart.brew() instanceof c.g.ColdBrew)) {
                return 'ColdBrewCart.brew() should return `new ColdBrew()`.';
              }
            }
          },
          {
            name: 'brew() makes a fresh cup every time',
            run: function (c) {
              var bar = new c.g.EspressoBar();
              if (bar.brew() === bar.brew()) {
                return 'brew() returned the same object twice — two customers would be sharing one ' +
                  'drink. Construct a new one on each call.';
              }
            }
          },
          {
            name: 'the inherited serve() works on both stands',
            run: function (c) {
              var bar = new c.g.EspressoBar();
              var cart = new c.g.ColdBrewCart();
              var msg = cupWrong(bar.serve(), c.expect.espresso, 'EspressoBar.serve()') ||
                cupWrong(cart.serve(), c.expect.coldBrew, 'ColdBrewCart.serve()');
              if (msg) return msg;
              if (bar.cupsServed !== 1 || cart.cupsServed !== 1) {
                return 'Each stand keeps its own tally: after one serve() each, both cupsServed ' +
                  'should be 1 (got ' + bar.cupsServed + ' and ' + cart.cupsServed + ').';
              }
            }
          }
        ]
      }
    ],

    quiz: [
      {
        q: 'The factory method itself is declared…',
        options: ['in the creator, unimplemented', 'in the product, as a field',
                  'in the client, as a helper', 'in a module, as a function'],
        answer: 0,
        explain: 'The creator declares it and calls it; subclasses decide what it returns. That ' +
          'inversion is the pattern — a standalone helper function is a "simple factory", not this.'
      },
      {
        q: 'What does the creator\'s <code>serve()</code> know about Espresso?',
        options: ['nothing at all', 'only its name',
                  'only its class', 'only its size'],
        answer: 0,
        explain: 'It deals in <code>Coffee</code>. Every concrete drink is named in exactly one ' +
          'place — the concrete creator that returns it.'
      },
      {
        q: 'Abstract Factory differs from Factory Method by creating…',
        options: ['a family of related products', 'exactly one shared instance',
                  'one product, via subclasses', 'products assembled in steps'],
        answer: 0,
        explain: 'Abstract Factory is one object with several creation methods that must agree ' +
          '(a matching chair <i>and</i> table). Option 2 is Singleton, option 4 is Builder, and ' +
          'option 3 is Factory Method itself.'
      }
    ]
};
