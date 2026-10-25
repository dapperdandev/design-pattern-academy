# Abstract Factory

**Creational** · Provide one interface for creating a whole family of related objects, so
client code gets pieces that belong together without naming any concrete class. *(GoF, 1994)*

## The cast

| Role | Job | Furniture-showroom example |
| --- | --- | --- |
| **Abstract Product** | One interface per *kind* of piece. | `Table`, `Seat` |
| **Concrete Product** | One class per kind *per family*. | `DiningTable`, `DiningChair`, `BarTable`, `BarStool` |
| **Abstract Factory** | One creation method per kind, each returning the abstract product. | `FurnitureFactory` |
| **Concrete Factory** | One per family; every method returns that family's piece. | `DiningSetFactory`, `BarSetFactory` |
| **Client** | Is handed a factory, builds a set, never names a concrete class. | `furnish(factory, guests)` |

## Minimal TypeScript skeleton

```ts
interface ProductA { a: number }          // one interface per KIND of piece
interface ProductB { b: number }          // distinct members, or TS treats them as one type

class A1 implements ProductA { a = 1 }    // family 1
class B1 implements ProductB { b = 1 }
class A2 implements ProductA { a = 2 }    // family 2
class B2 implements ProductB { b = 2 }

interface Factory {
  createA(): ProductA;                    // one method per kind, abstract return types
  createB(): ProductB;
}

class Family1 implements Factory {
  createA(): ProductA { return new A1(); }   // NOT `: A1`
  createB(): ProductB { return new B1(); }   // a NEW one every call
}

class Family2 implements Factory {
  createA(): ProductA { return new A2(); }
  createB(): ProductB { return new B2(); }
}

function client(factory: Factory) {       // typed to the interface — can't mix families
  return [factory.createA(), factory.createB()];
}
```

### The object-literal form

TypeScript's structural typing means a factory doesn't need a class:

```ts
const family1: Factory = {
  createA: () => new A1(),
  createB: () => new B1(),
};
```

Keep the class when a factory needs configuration or state; reach for the literal when it is
just a pairing of constructors.

## Rules of thumb

- **The pairing rule lives in exactly one place per family** — the concrete factory. Nowhere
  else in the codebase should know which pieces go together.
- Return the **abstract** product from every creation method. Narrowing to the concrete class
  invites callers to depend on the family you were hiding.
- Return a **fresh** piece per call. Four guests need four chairs, not one chair four times.
- Give each abstract product **distinct members**. TypeScript compares shapes: two interfaces
  with identical members are the same type, and the compiler can no longer tell a table from a
  seat.
- **Know the trade-off.** A new *family* is cheap — one new factory and its products. A new
  *kind* of piece is expensive — the interface grows, and every concrete factory must change.
- The client is **handed** a factory (composition). It doesn't subclass anything, and it
  doesn't choose the family — whoever constructs it does.

## Reach for it when…

- Objects come in families, and mixing families is a bug (themes, platforms, regional rules,
  test vs. production backends).
- The code assembling a set shouldn't know or care which family it's building.
- You want to swap a whole family at once, from one point of configuration.

## Skip it when…

- There's only one family. Constructors are fine.
- The pieces don't actually depend on each other — separate factories (or none) are simpler.
- The *kinds* of piece change more often than the families do. Every new kind touches every
  factory, and the pattern starts to cost more than it saves.

## Not to be confused with

- **Factory Method** — one product, chosen by a **subclass** overriding a method that the base
  class calls itself (inheritance). Abstract Factory is a **separate object** with several
  creation methods that must agree, handed to the client (composition). Each method on an
  abstract factory is often a small factory method.
- **Builder** — assembles *one* complex object step by step. Abstract Factory makes *several*
  related objects, each in one call.
- **Simple factory** — one function that switches on a "kind" argument. Nothing guarantees two
  calls return pieces from the same family.

## Node gotchas (type stripping)

`node file.ts` erases types but does **not** transform code:

- no `enum`
- no constructor parameter properties — `constructor(private x: T)`

Declare the field, assign it in the constructor body. Both throw
*"…is not supported in strip-only mode"*.

---

Sources: [Refactoring.Guru — Abstract Factory](https://refactoring.guru/design-patterns/abstract-factory) ·
*Design Patterns*, Gamma, Helm, Johnson & Vlissides (1994)

See also: [glossary](design-patterns-glossary.md) · [Factory Method](factory-method-pattern.md)
