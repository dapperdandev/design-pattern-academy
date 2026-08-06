# Builder

**Creational** · Separate the construction of a complex object from its representation, so
the same construction process can create different representations. *(GoF, 1994)*

## The cast

| Role | Job | Sandwich-shop example |
| --- | --- | --- |
| **Product** | The complex object being assembled. Knows nothing about builders. | `Sandwich` |
| **Builder** (interface) | Declares the construction steps common to all builders. | `SandwichBuilder` |
| **Concrete Builder** | Implements the steps against a real product; tracks the work-in-progress. | `DeliSandwichBuilder` |
| **Director** *(optional)* | Knows recipes — which steps, in which order. Talks only to the interface. | `SandwichArtist` |
| **Client** | Picks a builder; either hands it to a director or drives the steps itself. | your `main` code |

## Minimal TypeScript skeleton

```ts
class Product {
  // fields with sensible defaults, and no methods — the pattern needs none
}

interface Builder {
  reset(): this;
  stepA(x: string): this;   // every step returns `this` → chainable
  stepB(): this;
  build(): Product;         // only build() breaks the chain
}

class ConcreteBuilder implements Builder {
  private p = new Product();

  reset(): this { this.p = new Product(); return this; }
  stepA(x: string): this { /* mutate this.p */ return this; }
  stepB(): this { /* mutate this.p */ return this; }

  build(): Product {
    const done = this.p;
    this.reset();            // reusable: the next order starts clean
    return done;
  }
}

class Director {
  private builder: Builder;  // NOT constructor(private builder: Builder)

  constructor(builder: Builder) {
    this.builder = builder;
  }

  makeStandardThing(): Product {
    return this.builder.reset().stepA('preset').stepB().build();
  }
}
```

## Rules of thumb

- Every step mutates the work-in-progress and returns `this` — the
  [polymorphic `this` type](https://www.typescriptlang.org/docs/handbook/2/classes.html#this-types).
  That is the fluent API.
- `build()` hands over the product, then resets. One builder instance serves many orders.
- **Each director recipe starts with `reset()`.** It cannot assume the builder is clean — a
  client may have left it mid-order. Skipping this works right up until it doesn't.
- The director depends on the *interface*, never a concrete builder. Swap builders to get
  different representations from the same recipe.
- Recipes belong to the director; one-off orders can drive the builder directly. The director
  is [explicitly optional](https://refactoring.guru/design-patterns/builder).
- Product fields stay **mutable** — `readonly` and a builder are a contradiction. Note that
  `readonly` protects the binding, not the contents: `readonly items: T[]` still allows
  `items.push(x)`, so it buys less than it appears to.
- Model absence as `null`, not a sentinel member. `Cheese = 'cheddar' | 'swiss'` with
  `cheese: Cheese | null` beats adding a `'none'` member — absence isn't a kind of cheese, and
  the setter then can't be handed a non-cheese.

## Reach for it when…

- A constructor is telescoping: many parameters, most optional.
- The same construction steps should yield different representations.
- Construction is genuinely step-wise (assembled over time, validated at the end).

## Skip it when…

- An object literal with optional properties says it all:
  `new Sandwich({ bread: 'rye', toasted: true })`. TypeScript's named/optional properties cover
  many classic builder use-cases.
- There's only one representation and construction is one shot — a plain constructor wins.

## Node gotchas (type stripping)

`node file.ts` erases types but does **not** transform code:

- no `enum`
- no constructor parameter properties — `constructor(private x: T)`

Declare the field, assign it in the constructor body. Both throw
*"…is not supported in strip-only mode"*.

Also: an optional field with no initializer (`cheese?: Cheese`) is not the same as
`cheese: Cheese | null = null`. The optional one may not exist as a property at all depending
on the target, so prefer an explicit default.

---

Sources: [Refactoring.Guru — Builder](https://refactoring.guru/design-patterns/builder) ·
*Design Patterns*, Gamma, Helm, Johnson & Vlissides (1994) ·
[TS Handbook — `this` types](https://www.typescriptlang.org/docs/handbook/2/classes.html#this-types)

See also: [glossary](design-patterns-glossary.md)
