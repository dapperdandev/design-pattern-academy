# Strategy

**Behavioral** · Define a family of interchangeable algorithms, put each behind one interface,
and let the algorithm vary independently of the code that uses it. *(GoF, 1994)*

## The cast

| Role | Job | Shipping-rate example |
| --- | --- | --- |
| **Strategy** (interface) | Declares the one operation every algorithm supports. | `ShippingStrategy` |
| **Concrete Strategy** | One algorithm, start to finish. Shares the interface, not an implementation. | `StandardShipping`, `OvernightShipping` |
| **Context** | Holds a strategy and delegates to it. Never implements a rate, never names one. | `Checkout` |
| **Client** | Picks the concrete strategy and hands it to the context. | your `main` code |

## Minimal TypeScript skeleton

```ts
type Input = { /* whatever every algorithm needs */ };

interface Strategy {
  run(input: Input): number;      // usually ONE method — keep it narrow
}

class FirstWay implements Strategy {
  run(input: Input): number { /* one whole algorithm */ return 0; }
}

class Context {
  private strategy: Strategy;     // NOT constructor(private strategy: Strategy)

  constructor(strategy: Strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: Strategy): void {
    this.strategy = strategy;     // swapping the object IS the mechanism
  }

  run(input: Input): number {
    return this.strategy.run(input);   // delegate; decide nothing
  }
}
```

### The function form

A one-method strategy carries the same information as a function, and TypeScript's structural
typing makes the two interchangeable:

```ts
type RunFn = (input: Input) => number;

function asStrategy(run: RunFn): Strategy {
  return { run };               // an object literal *is* a Strategy
}

context.setStrategy(asStrategy(() => 0));
```

Keep the class when an algorithm needs configuration, state, or a name to log. Reach for the
function when it is one expression.

## Rules of thumb

- **The client chooses; the context delegates.** A context that decides which algorithm applies
  has the `switch` back inside it, one level down.
- Type the field, the constructor **and** the setter to the interface. That is what makes a new
  algorithm a new file instead of an edit.
- Keep concrete strategies **stateless** where you can — everything they need arrives as the
  argument. Stateless strategies are shareable and trivially testable.
- Strategies share an interface, *not* a base class. If two of them want to share code, that is
  a helper function, not inheritance.
- Different strategies may read different parts of the input. That is normal: each one owns its
  algorithm outright.
- One method is the common case. A Strategy that grows a second method is usually turning into
  something else — check whether you want [Template Method](https://refactoring.guru/design-patterns/template-method)
  or a plain collaborator.

## Reach for it when…

- A method branches on a "kind" or "mode" flag, and each branch is a self-contained algorithm.
- You want to add algorithms without editing the caller (open/closed, in one specific spot).
- Behaviour must change at run time — per request, per user, per feature flag.

## Skip it when…

- There is exactly one algorithm and no prospect of a second. A method is a method.
- The branches are one-liners that share most of their logic; the indirection costs more than
  the `if`.
- The choice is fixed at compile time and never varies — pass the function directly and skip
  the ceremony.

## Not to be confused with

- **State** — same shape (context + interchangeable objects), different intent: State's objects
  represent *what the context is now* and often decide the next transition themselves.
- **Factory Method** — also swaps behaviour via subclasses, but what varies is *which class gets
  instantiated*, not which algorithm runs.
- **Template Method** — varies *steps inside* one fixed algorithm via inheritance; Strategy
  replaces the whole algorithm via composition.

## Node gotchas (type stripping)

`node file.ts` erases types but does **not** transform code:

- no `enum` — a union of string literals does the job
- no constructor parameter properties — `constructor(private strategy: Strategy)`

Declare the field, assign it in the constructor body. Both throw
*"…is not supported in strip-only mode"*.

---

Sources: [Refactoring.Guru — Strategy](https://refactoring.guru/design-patterns/strategy) ·
*Design Patterns*, Gamma, Helm, Johnson & Vlissides (1994)

See also: [glossary](design-patterns-glossary.md)
