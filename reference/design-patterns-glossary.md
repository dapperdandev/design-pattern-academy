# Design Patterns — Glossary

Shared vocabulary for the series. Every exercise sticks to these definitions. Grows one
pattern at a time.

## Categories

**Creational pattern**
: A pattern about *how objects get made* — hiding or organising instantiation. Covered so far:
Singleton, Builder. Queued: Factory Method, Abstract Factory, Prototype.

## Builder roles

**Product**
: The complex object under construction. Carries data (and behaviour if it needs any) but knows
nothing about how it gets built.

**Builder** (interface)
: Declares the construction steps, abstracted from any concrete implementation. In TypeScript,
an `interface` whose steps return `this`.

**Concrete Builder**
: Implements the steps against a real product; holds the work-in-progress in a private field.
`build()` hands the product over, then resets.

**Director**
: Holds the *recipes*: which steps to call, in what order. Depends only on the builder
interface, and starts each recipe with `reset()` since it can't assume the builder is clean.
Optional — clients may drive the steps themselves
([Refactoring.Guru](https://refactoring.guru/design-patterns/builder)).

**Client**
: Code that picks a concrete builder and either hands it to a director (menu order) or chains
steps directly (custom order).

## Techniques and smells

**Fluent API / method chaining**
: Methods that return the receiver so calls chain: `b.setBread('rye').addDeck().build()`. In
TypeScript, type the return as
[polymorphic `this`](https://www.typescriptlang.org/docs/handbook/2/classes.html#this-types)
so subclasses chain correctly.

**Telescoping constructor**
: A constructor (or overload pile) with many mostly-optional positional parameters:
`new Sandwich('rye', 2, 'swiss', [], true)`. The classic motivation for Builder.

**Sentinel value**
: A real value standing in for absence — a `'none'` member of a union, `-1` for "not found".
Prefer `null` or an optional property: absence isn't a kind of the thing.

## Patterns

**Singleton**
: Restricts a class to one instance and provides a global access point (private constructor +
static `getInstance()`).

**Builder**
: Separates the construction of a complex object from its representation so the same process can
create different representations (GoF). See the [cheat sheet](builder-pattern.md).

---

Canonical source: *Design Patterns*, Gamma, Helm, Johnson & Vlissides (1994).
