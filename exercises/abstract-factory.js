/**
 * Exercise 0004 — Abstract Factory pattern, furniture-showroom edition.
 *
 * Content only: prose, expectations, checks, quiz. The extension supplies the
 * lesson panel and the gating; VS Code supplies the editor and type-checking.
 *
 * The two families differ in a way that matters, not just in a label: a bar stool
 * at a dining table puts your knees above the tabletop. Heights make "products
 * that must be used together" concrete and checkable — without them, the
 * families would only differ by name and the pattern would look like ceremony.
 *
 * The client (`furnish`) is a try-it-out prompt in the finale, not a graded step,
 * matching the other lessons: using what you built is the reward, not a test.
 */
'use strict';

/**
 * A comfortable gap between seat and tabletop is roughly 30 cm. Both families are
 * designed around it; a mixed pair misses it by a mile, which is what the failure
 * messages show.
 */
function gapNote(table, seat) {
  var gap = table.surfaceHeightCm - seat.seatHeightCm;
  if (gap <= 10) return ' That pair leaves a ' + gap + ' cm gap — knees above the tabletop.';
  if (gap >= 50) return ' That pair leaves a ' + gap + ' cm gap — chin on the table.';
  return '';
}

/** Check one concrete product's class and height. Returns a message, or null. */
function productWrong(c, name, field, want) {
  var Ctor = c.g[name];
  if (typeof Ctor !== 'function') return 'No ' + name + ' class found yet.';
  var got = new Ctor()[field];
  if (got !== want) return 'new ' + name + '().' + field + ' should be ' + want + ' but was ' + JSON.stringify(got) + '.';
  return null;
}

/**
 * Check that a concrete factory hands out one family, fresh pieces, every call.
 * `family` is { factory, table, seat } — the class names that belong together.
 */
function familyWrong(c, family) {
  var F = c.g[family.factory];
  if (typeof F !== 'function') return 'No ' + family.factory + ' class found yet.';
  var factory = new F();
  if (typeof factory.createTable !== 'function' || typeof factory.createSeat !== 'function') {
    return family.factory + ' needs both createTable() and createSeat().';
  }
  var table = factory.createTable();
  var seat = factory.createSeat();
  if (!(table instanceof c.g[family.table])) {
    var gotT = table && table.constructor ? table.constructor.name : JSON.stringify(table);
    return family.factory + '.createTable() should return a new ' + family.table + ', but returned ' +
      gotT + '.' + (seat && table ? gapNote(table, seat) : '');
  }
  if (!(seat instanceof c.g[family.seat])) {
    var gotS = seat && seat.constructor ? seat.constructor.name : JSON.stringify(seat);
    return family.factory + '.createSeat() should return a new ' + family.seat + ', but returned ' +
      gotS + '.' + (seat ? gapNote(table, seat) : '') +
      ' A factory hands out one family — that is the whole guarantee.';
  }
  if (factory.createSeat() === seat || factory.createTable() === table) {
    return family.factory + ' returned the same object twice. Each guest needs their own seat — ' +
      'construct a new one on every call.';
  }
  return null;
}

module.exports = {
    meta: {
      id: 'abstract-factory',
      number: '0004',
      title: 'The Abstract Factory Pattern',
      heading: 'Pieces that belong together, from one place',
      emoji: '🪑',
      domain: 'Furniture showroom',
      category: 'Creational',
      blurb: 'Dining sets and bar sets, and one object per family that can only hand out matching ' +
             'pieces. Abstract Product, Concrete Product, Abstract Factory, Concrete Factory.',
      intro:
        '<p class="lede"><b>Abstract Factory</b> puts a whole <i>family</i> of related objects ' +
        'behind one interface, so code that needs a set of them can only ever get pieces that ' +
        'belong together — without naming a single concrete class.</p>' +
        '<h3>The problem it solves</h3>' +
        '<p>Some objects only work in matching sets. A dining table wants dining chairs; a bar ' +
        'table wants bar stools. Build them with <code>new</code> and nothing stops a mix:</p>' +
        '<pre class="snippet">const table = new BarTable();   // 105 cm tall\n' +
        'const seat = new DiningChair(); //  45 cm seat — chin on the table</pre>' +
        '<p>Every place that assembles a set has to know which classes go together, and that ' +
        'knowledge gets copied everywhere a set is built. Abstract Factory gives each family one ' +
        'object that makes all of its pieces. Hand code a factory, and the only set it can build ' +
        'is a matching one.</p>' +
        '<h3>The cast</h3>' +
        '<table>' +
        '<tr><th>Abstract Product</th><td>One interface per <i>kind</i> of piece. ' +
          '— <code>Table</code>, <code>Seat</code></td></tr>' +
        '<tr><th>Concrete Product</th><td>One class per kind <i>per family</i>. ' +
          '— <code>DiningTable</code>, <code>DiningChair</code>, <code>BarTable</code>, ' +
          '<code>BarStool</code></td></tr>' +
        '<tr><th>Abstract Factory</th><td>Interface with one creation method per kind of piece. ' +
          '— <code>FurnitureFactory</code></td></tr>' +
        '<tr><th>Concrete Factory</th><td>One per family; every method returns that family\'s ' +
          'piece. — <code>DiningSetFactory</code>, <code>BarSetFactory</code></td></tr>' +
        '<tr><th>Client</th><td>Takes a factory, builds a set, and never names a concrete class. ' +
          '— your code at the bottom of the file</td></tr>' +
        '</table>' +
        '<h3>Reach for it when…</h3>' +
        '<ul><li>objects come in families, and mixing families is a bug</li>' +
        '<li>the code assembling a set shouldn\'t know which family it\'s building</li>' +
        '<li>you want a new family to be new classes, not edits to every place sets are built</li></ul>' +
        '<h3>…and skip it when</h3>' +
        '<p>there is only one family, or the pieces don\'t depend on each other — separate ' +
        'constructors are then simpler. And know the trade-off going in: a new <i>family</i> is ' +
        'cheap (one new factory), but a new <i>kind</i> of piece means editing the interface and ' +
        'every factory that implements it.</p>' +
        '<p>You will build the four roles in the order above, then write the client yourself in ' +
        'the try-it-out at the end.</p>',
      howto: 'Write your code in <code>abstract-factory.ts</code> beside this panel. Every save ' +
        're-runs the checks, or press <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Enter</kbd>. Type errors ' +
        'come from VS Code itself — if it\'s underlined in the editor, fix that first. You can also ' +
        'run the file directly: <code>node abstract-factory/abstract-factory.ts</code>.',
      primarySource: {
        url: 'https://refactoring.guru/design-patterns/abstract-factory',
        label: 'Abstract Factory — Refactoring.Guru',
        note: '(families, and how it relates to Factory Method). Canonical reference: ' +
              '<i>Design Patterns</i>, Gamma, Helm, Johnson &amp; Vlissides (1994).'
      },
      references: [
        { name: 'abstract-factory-pattern.md', label: 'Abstract Factory cheat sheet' },
        { name: 'design-patterns-glossary.md', label: 'Design-patterns glossary' }
      ],
      finale: '🎉 <b>All four roles built.</b>' +
        '<p><b>Try it out — write the client.</b> It takes <i>any</i> factory and furnishes a room. ' +
        'Notice what it never mentions:</p>' +
        '<pre class="snippet">function furnish(factory: FurnitureFactory, guests: number) {\n' +
        '  const seats: Seat[] = [];\n' +
        '  for (let i = 0; i &lt; guests; i++) {\n' +
        '    seats.push(factory.createSeat());\n' +
        '  }\n' +
        '  return { table: factory.createTable(), seats };\n' +
        '}\n\n' +
        'console.log(furnish(new DiningSetFactory(), 4));\n' +
        'console.log(furnish(new BarSetFactory(), 2));</pre>' +
        '<p>Run it: <code>node abstract-factory/abstract-factory.ts</code>. <code>furnish</code> ' +
        'cannot produce a mismatched room — not because it checks, but because the only pieces it ' +
        'can reach come from one factory.</p>' +
        '<p><b>To make it stick:</b></p>' +
        '<ul style="margin:8px 0 0; padding-left:18px;">' +
        '<li><b>Now:</b> add a third family — a coffee-table set, a counter-height set — and pass it ' +
          'to <code>furnish</code>. Nothing above the new classes should change.</li>' +
        '<li><b>Next:</b> add a third <i>kind</i> of piece, a bench. Count the files you touch. ' +
          'That asymmetry — families cheap, kinds expensive — is the pattern\'s real trade-off.</li>' +
        '<li><b>Then:</b> say from memory how this differs from Factory Method. Which one is an ' +
          'object you pass in, and which one is a subclass that overrides?</li>' +
        '<li><b>In ~2 days:</b> rebuild the file cold. Spaced retrieval beats rereading.</li></ul>'
    },

    // The four product classes and the two factories; the three interfaces are
    // erased at runtime, so steps 1 and 3 are checked against the source.
    captures: ['DiningTable', 'DiningChair', 'BarTable', 'BarStool', 'DiningSetFactory', 'BarSetFactory'],

    // Heights in centimetres. Each family is built around a ~30 cm seat-to-table gap.
    expected: {
      diningTable: 75,
      diningChair: 45,
      barTable: 105,
      barStool: 75,
      families: [
        { factory: 'DiningSetFactory', table: 'DiningTable', seat: 'DiningChair' },
        { factory: 'BarSetFactory', table: 'BarTable', seat: 'BarStool' }
      ]
    },

    scaffold: [
      '/**',
      ' * THE ABSTRACT FACTORY PATTERN - furniture-showroom edition',
      ' * Follow the steps in the left panel. Run checks: Ctrl+Alt+Enter.',
      ' */',
      '',
      '// -- STEP 1 - ABSTRACT PRODUCTS --------------------------------',
      '',
      '',
      '// -- STEP 2 - CONCRETE PRODUCTS --------------------------------',
      '',
      '',
      '// -- STEP 3 - ABSTRACT FACTORY ---------------------------------',
      '',
      '',
      '// -- STEP 4 - CONCRETE FACTORIES -------------------------------',
      '',
      ''
    ].join('\n'),

    steps: [
      {
        title: 'Abstract Products',
        chip: 'role: Abstract Product',
        body:
          '<p>An <b>Abstract Product</b> is the interface for one <i>kind</i> of piece. There are ' +
          'two kinds here, so two interfaces. <b>Write:</b></p><ul>' +
          '<li><code>interface Table</code> with <code>surfaceHeightCm: number</code></li>' +
          '<li><code>interface Seat</code> with <code>seatHeightCm: number</code></li></ul>' +
          '<p class="why">Why <code>Seat</code> and not <code>Chair</code>? The abstraction has to ' +
          'cover a dining chair <i>and</i> a bar stool. Naming it after one of them would leak a ' +
          'family into the interface.</p>' +
          '<p class="why">Why different member names instead of a shared <code>heightCm</code>? ' +
          'TypeScript compares shapes, not names: two interfaces with identical members are ' +
          'interchangeable, so a factory could hand you a chair where it promised a table and the ' +
          'compiler would shrug. Distinct members keep the two kinds distinct types.</p>' +
          '<p><b>Checkpoint:</b> run checks. Nothing to log yet — interfaces are erased at compile ' +
          'time, so this step is verified by reading your <i>source text</i>.</p>',
        checks: [
          {
            name: 'interface Table declares surfaceHeightCm',
            run: function (c) {
              if (!/interface\s+Table\b/.test(c.clean)) {
                return 'Declare `interface Table { surfaceHeightCm: number; }`. (Interfaces are erased ' +
                  'at compile time, so this check reads your source text.)';
              }
              var m = c.clean.match(/interface\s+Table\s*\{([\s\S]*?)\}/);
              if (!m || !/\bsurfaceHeightCm\s*:\s*number/.test(m[1])) {
                return 'Table needs `surfaceHeightCm: number`.';
              }
            }
          },
          {
            name: 'interface Seat declares seatHeightCm',
            run: function (c) {
              if (!/interface\s+Seat\b/.test(c.clean)) {
                return 'Declare `interface Seat { seatHeightCm: number; }`.';
              }
              var m = c.clean.match(/interface\s+Seat\s*\{([\s\S]*?)\}/);
              if (!m || !/\bseatHeightCm\s*:\s*number/.test(m[1])) {
                return 'Seat needs `seatHeightCm: number`.';
              }
            }
          }
        ]
      },

      {
        title: 'Concrete Products',
        chip: 'role: Concrete Product',
        body:
          '<p>One class per kind of piece <i>per family</i> — two kinds times two families is four ' +
          'small classes. <b>Write:</b></p><ul>' +
          '<li><code>DiningTable implements Table</code> — 75 cm</li>' +
          '<li><code>DiningChair implements Seat</code> — 45 cm</li>' +
          '<li><code>BarTable implements Table</code> — 105 cm</li>' +
          '<li><code>BarStool implements Seat</code> — 75 cm</li></ul>' +
          '<details class="hint"><summary>Hint — the shape of one</summary>' +
          '<pre class="snippet">class DiningTable implements Table {\n' +
          '  surfaceHeightCm = 75;\n' +
          '}</pre></details>' +
          '<p class="why">Look at the numbers. Each family leaves about 30 cm between seat and ' +
          'tabletop — that is what makes them a family rather than four unrelated classes. Pair ' +
          'across families and you get 0 cm or 60 cm. The rest of the lesson is about making that ' +
          'pairing impossible to get wrong.</p>' +
          '<p><b>Checkpoint:</b></p>' +
          '<pre class="snippet">console.log(new DiningTable().surfaceHeightCm - new DiningChair().seatHeightCm);\n' +
          'console.log(new BarTable().surfaceHeightCm - new BarStool().seatHeightCm);</pre>' +
          '<div class="expected">30\n30</div>',
        checks: [
          {
            name: 'each piece implements its kind',
            run: function (c) {
              var pairs = [['DiningTable', 'Table'], ['DiningChair', 'Seat'],
                           ['BarTable', 'Table'], ['BarStool', 'Seat']];
              for (var i = 0; i < pairs.length; i++) {
                var cls = pairs[i][0];
                var kind = pairs[i][1];
                var declared = new RegExp('class\\s+' + cls + '\\s+implements\\s+' + kind + '\\b').test(c.clean);
                if (!declared || typeof c.g[cls] !== 'function') {
                  return 'Declare `class ' + cls + ' implements ' + kind + '`.';
                }
              }
            }
          },
          {
            name: 'the dining set: 75 cm table, 45 cm chair',
            run: function (c) {
              return productWrong(c, 'DiningTable', 'surfaceHeightCm', c.expect.diningTable) ||
                productWrong(c, 'DiningChair', 'seatHeightCm', c.expect.diningChair);
            }
          },
          {
            name: 'the bar set: 105 cm table, 75 cm stool',
            run: function (c) {
              return productWrong(c, 'BarTable', 'surfaceHeightCm', c.expect.barTable) ||
                productWrong(c, 'BarStool', 'seatHeightCm', c.expect.barStool);
            }
          }
        ]
      },

      {
        title: 'The Abstract Factory',
        chip: 'role: Abstract Factory',
        body:
          '<p>The <b>Abstract Factory</b> is an interface with one creation method per <i>kind</i> ' +
          'of piece. It is the contract every family signs. <b>Write:</b></p>' +
          '<pre class="snippet">interface FurnitureFactory {\n' +
          '  createTable(): Table;\n' +
          '  createSeat(): Seat;\n' +
          '}</pre>' +
          '<p class="why">Both methods return the <i>abstract</i> products. Code holding a ' +
          '<code>FurnitureFactory</code> can ask for a table and a seat, and has no way to name — ' +
          'or depend on — the concrete classes behind them.</p>' +
          '<p class="why">Each of those methods is a small factory method in its own right. ' +
          'Abstract Factory is often described as several factory methods that have to agree, ' +
          'bundled into one object.</p>' +
          '<p><b>Checkpoint:</b> run checks. Still nothing to log — this step is read from your ' +
          'source.</p>',
        checks: [
          {
            name: 'interface FurnitureFactory declared',
            run: function (c) {
              if (!/interface\s+FurnitureFactory\b/.test(c.clean)) {
                return 'Declare `interface FurnitureFactory { ... }`.';
              }
            }
          },
          {
            name: 'one creation method per kind, each returning the abstract product',
            run: function (c) {
              var m = c.clean.match(/interface\s+FurnitureFactory\s*\{([\s\S]*?)\}/);
              if (!m) return 'Could not read the interface body.';
              if (!/createTable\s*\(\s*\)\s*:\s*Table\b/.test(m[1])) {
                return 'FurnitureFactory needs `createTable(): Table`.';
              }
              if (!/createSeat\s*\(\s*\)\s*:\s*Seat\b/.test(m[1])) {
                return 'FurnitureFactory needs `createSeat(): Seat`.';
              }
            }
          }
        ]
      },

      {
        title: 'Concrete Factories',
        chip: 'role: Concrete Factory',
        body:
          '<p>One <b>Concrete Factory</b> per family. Each implements <code>FurnitureFactory</code>, ' +
          'and every method returns a piece from <i>its</i> family. <b>Write both:</b></p><ul>' +
          '<li><code>DiningSetFactory</code> — a <code>DiningTable</code> and ' +
            '<code>DiningChair</code>s</li>' +
          '<li><code>BarSetFactory</code> — a <code>BarTable</code> and <code>BarStool</code>s</li></ul>' +
          '<details class="hint"><summary>Hint — one method</summary>' +
          '<pre class="snippet">createSeat(): Seat {\n' +
          '  return new DiningChair();\n' +
          '}</pre></details>' +
          '<p class="why">Keep the return types abstract — <code>createSeat(): Seat</code>, not ' +
          '<code>: DiningChair</code>. Narrowing it lets callers start depending on the family, ' +
          'which is the coupling the pattern exists to remove.</p>' +
          '<p class="why">And make a <b>new</b> piece on every call. A room for four needs four ' +
          'chairs, not one chair four times.</p>' +
          '<p class="why">These two classes are now the <i>only</i> place in the file that knows ' +
          'which pieces go together. That is the point: the pairing rule lives in one spot per ' +
          'family instead of everywhere a set is assembled.</p>' +
          '<p><b>Checkpoint:</b></p>' +
          '<pre class="snippet">const showroom: FurnitureFactory = new BarSetFactory();\n' +
          'console.log(showroom.createTable(), showroom.createSeat());</pre>' +
          '<div class="expected">BarTable { surfaceHeightCm: 105 } BarStool { seatHeightCm: 75 }</div>',
        checks: [
          {
            name: 'both factories implement FurnitureFactory',
            run: function (c) {
              var names = ['DiningSetFactory', 'BarSetFactory'];
              for (var i = 0; i < names.length; i++) {
                var n = names[i];
                var declared = new RegExp('class\\s+' + n + '\\s+implements\\s+FurnitureFactory\\b')
                  .test(c.clean);
                if (!declared || typeof c.g[n] !== 'function') {
                  return 'Declare `class ' + n + ' implements FurnitureFactory`.';
                }
              }
            }
          },
          {
            name: 'creation methods still promise the abstract products',
            run: function (c) {
              var m = c.clean.match(/create(?:Table|Seat)\s*\(\s*\)\s*:\s*(DiningTable|DiningChair|BarTable|BarStool)\b/);
              if (m) {
                return 'A creation method is annotated `: ' + m[1] + '`. Keep the promise abstract — ' +
                  '`createTable(): Table`, `createSeat(): Seat` — so callers can\'t come to depend on ' +
                  'the family.';
              }
            }
          },
          {
            name: 'DiningSetFactory hands out only dining pieces',
            run: function (c) {
              return familyWrong(c, c.expect.families[0]);
            }
          },
          {
            name: 'BarSetFactory hands out only bar pieces',
            run: function (c) {
              return familyWrong(c, c.expect.families[1]);
            }
          }
        ]
      }
    ],

    quiz: [
      {
        q: 'What does an abstract factory guarantee that four separate constructors cannot?',
        options: ['pieces all from one family', 'exactly one shared instance',
                  'pieces assembled step by step', 'a subclass picks each piece'],
        answer: 0,
        explain: 'Every method on one factory returns the same family, so a client holding it can ' +
          'only build a matching set. Option 2 is Singleton, option 3 is Builder, option 4 is ' +
          'Factory Method.'
      },
      {
        q: 'Adding a <i>new kind</i> of piece (a bench) means editing…',
        options: ['the interface and every factory', 'only one brand-new factory',
                  'only the client that builds sets', 'nothing that already exists'],
        answer: 0,
        explain: 'The abstract factory grows a <code>createBench()</code>, so every concrete factory ' +
          'must implement it. New <i>families</i> are cheap; new <i>kinds</i> are not. That ' +
          'asymmetry is the pattern\'s main cost.'
      },
      {
        q: 'Compared with Factory Method, the factory here is…',
        options: ['an object handed to the client', 'a subclass of the client class',
                  'a static method on a product', 'a switch on a "kind" argument'],
        answer: 0,
        explain: 'Abstract Factory works by composition: the client is given a factory object. ' +
          'Factory Method works by inheritance: a subclass overrides one creation method.'
      }
    ]
};
