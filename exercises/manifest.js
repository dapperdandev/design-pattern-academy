/**
 * The exercise catalog. Add a folder name here to make it appear on the home page.
 * Order doesn't matter — cards sort by meta.number.
 *
 * `planned` entries are shown greyed out on the catalog with no link; move an id
 * from `planned` to `exercises` when its folder exists.
 */
Dojo.catalog = {
  exercises: [
    'builder'
  ],

  planned: [
    { number: '0002', title: 'Factory Method', emoji: '🏭', category: 'Creational' },
    { number: '0003', title: 'Abstract Factory', emoji: '🏬', category: 'Creational' },
    { number: '0004', title: 'Prototype', emoji: '🧬', category: 'Creational' },
    { number: '0005', title: 'Adapter', emoji: '🔌', category: 'Structural' },
    { number: '0006', title: 'Decorator', emoji: '🎁', category: 'Structural' },
    { number: '0007', title: 'Facade', emoji: '🏛️', category: 'Structural' },
    { number: '0008', title: 'Proxy', emoji: '🕴️', category: 'Structural' },
    { number: '0009', title: 'Observer', emoji: '📡', category: 'Behavioral' },
    { number: '0010', title: 'Strategy', emoji: '♟️', category: 'Behavioral' },
    { number: '0011', title: 'Command', emoji: '🎮', category: 'Behavioral' },
    { number: '0012', title: 'Iterator', emoji: '🔁', category: 'Behavioral' }
  ]
};
