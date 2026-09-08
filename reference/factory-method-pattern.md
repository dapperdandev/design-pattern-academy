# Factory Method

**Creational** · Let a subclass decide which class to instantiate: the base class declares the
creating method and defers the choice. *(GoF, 1994)*

## The cast

| Role | Job | Coffee-stand example |
| --- | --- | --- |
| **Product** (interface) | The type everything deals in, so no other role names a concrete class. | `Coffee` |
| **Concrete Product** | One real implementation. Named in exactly one place. | `Espresso`, `ColdBrew` |
| **Creator** | Declares the factory method (unimplemented) and *uses* it in its own logic. | `CoffeeStand` |
| **Concrete Creator** | Overrides the factory method to return one concrete product. | `EspressoBar`, `ColdBrewCart` |
| **Client** | Holds a `Creator`, calls its operations, never sees a concrete product. | your `main` code |

## Minimal TypeScript skeleton

```ts
interface Product {
  // the fields (and behaviour) every product shares
}

class RealProduct implements Product {}

abstract class Creator {
  made = 0;

  abstract make(): Product;      // THE FACTORY METHOD — no body

  operate(): Product {           // the creator's own logic, inherited by all
    const p = this.make();       // …wrapped around a creation step it delegates
    this.made++;
    return p;
  }
}

class RealCreator extends Creator {
  make(): Product {              // NOT `: RealProduct` — don't narrow the promise
    return new RealProduct();    // a NEW one every call
  }
}
```

## Rules of thumb

- **The creator must have work of its own.** `operate()` is the justification for the role: if
  the creator only ever calls `new`, a plain `makeThing(kind)` function is the better answer and
  the class is ceremony. (A bare function like that is a *simple factory* — useful, but not this
  pattern.)
- The factory method is declared where it is **used**, and implemented where the choice is
  **known**. That inversion is the whole idea.
- Return the **interface**, not the concrete class. Narrowing invites callers to depend on the
  product you were trying to hide.
- Return a **fresh** product per call. Handing out a stored instance is a different pattern
  (and usually a bug — two callers sharing one object).
- Concrete creators should be boring: one overridden method, nothing else. Everything shared
  lives in the creator.
- `abstract` is optional scaffolding. An interface plus a default implementation, or a creator
  whose factory method throws, gets you the same shape — `abstract` just makes the compiler
  enforce it.

## Reach for it when…

- A class does useful work around creating something, but shouldn't know *which* something.
- You want a new variant to be a new subclass rather than an edit to a `switch`.
- Subclasses already exist for other reasons and each naturally pairs with its own product.

## Skip it when…

- There is one product and no prospect of a second. `new` is fine.
- Nothing surrounds the creation — a function returning the right class is simpler and honest
  about what it is.
- The variants are chosen by data, not by type: a lookup table of constructors may beat a
  subclass per product.

## Not to be confused with

- **Abstract Factory** — one object with *several* creation methods that must agree (a matching
  chair *and* table). Factory Method is one product, chosen by subclass.
- **Builder** — assembles one complex object step by step. Factory Method makes one call.
- **Simple factory** — a standalone function or `static` method with a `switch`. Common, useful,
  not a GoF pattern.
- **Prototype** — makes new objects by *copying* an existing one rather than naming a class.

## Node gotchas (type stripping)

`node file.ts` erases types but does **not** transform code:

- no `enum`
- no constructor parameter properties — `constructor(private x: T)`

`abstract` *is* fine: both the modifier and the bodiless method are erased. Which means
`new Creator()` will happily **run** — only the type-checker stops you. Same lesson as
`readonly` in Builder: types are gone at runtime, so a clean editor is a precondition for the
behavioural checks, not a nicety.

---

Sources: [Refactoring.Guru — Factory Method](https://refactoring.guru/design-patterns/factory-method) ·
*Design Patterns*, Gamma, Helm, Johnson & Vlissides (1994)

See also: [glossary](design-patterns-glossary.md)
