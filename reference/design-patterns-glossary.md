# Design Patterns — Glossary

Shared vocabulary for these exercises — every lesson sticks to these definitions. Grows one
pattern at a time.

## Categories

**Creational pattern**
: A pattern about *how objects get made* — hiding or organising instantiation. Exercises so far:
Builder, Factory Method, Abstract Factory. Queued: Prototype, Singleton.

**Behavioral pattern**
: A pattern about *how objects collaborate* — who calls whom, and what varies at run time.
Exercises so far: Strategy. Queued: Observer, Command, Iterator.

**Structural pattern**
: A pattern about *how objects are composed* into larger shapes. Queued: Adapter, Decorator,
Facade, Proxy.

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

## Strategy roles

**Strategy** (interface)
: The contract for one interchangeable algorithm. Usually a single method; the narrower it is,
the cheaper a new algorithm is to add.

**Concrete Strategy**
: One whole algorithm behind that interface. Shares the interface, never a base class. Best kept
stateless — everything it needs arrives as the argument.

**Context**
: Holds a strategy and delegates to it. Types its field, constructor and setter to the
*interface*, implements no algorithm of its own, and decides nothing about which one applies.

**Client**
: Code that picks the concrete strategy and hands it to the context. The choice belongs here —
a context that chooses has the branch back inside it
([Refactoring.Guru](https://refactoring.guru/design-patterns/strategy)).

## Factory Method roles

**Creator**
: Declares the factory method without implementing it, and calls it from its own logic. That
surrounding logic is what earns the role — a creator that only calls `new` should be a function.

**Concrete Creator**
: Overrides the factory method to return one concrete product, and does nothing else. Everything
shared stays in the creator.

**Factory method**
: The method declared where it is *used* and implemented where the choice is *known*. Returns
the product interface, and a fresh product on every call.

**Concrete Product**
: One real implementation of the product interface — named in exactly one place, the concrete
creator that returns it.

## Abstract Factory roles

**Abstract Product**
: The interface for one *kind* of piece in a family — `Seat`, covering both a dining chair and a
bar stool. Give each kind distinct members, or structural typing makes them interchangeable.

**Abstract Factory**
: An interface with one creation method per kind of piece, each returning the abstract product.
The contract every family signs.

**Concrete Factory**
: One per family. Every creation method returns that family's piece, so the rule about which
pieces go together lives in exactly one place.

**Product family**
: A set of concrete products designed to be used together — a dining table with dining chairs.
Mixing families is the bug the pattern prevents.

## Techniques and smells

**Fluent API / method chaining**
: Methods that return the receiver so calls chain: `b.setBread('rye').addTopping('pastrami').build()`. In
TypeScript, type the return as
[polymorphic `this`](https://www.typescriptlang.org/docs/handbook/2/classes.html#this-types)
so subclasses chain correctly.

**Telescoping constructor**
: A constructor (or overload pile) with many mostly-optional positional parameters:
`new Sandwich('rye', 'swiss', [], true)`. The classic motivation for Builder.

**Simple factory**
: A standalone function or `static` method that switches on an argument and returns one of
several classes. Common and useful, but not a GoF pattern — and not Factory Method, which puts
the choice in a *subclass* of the class that uses it.

**Structural typing**
: TypeScript compares shapes, not declared lineage: any object with a `quote(parcel)` method
*is* a `ShippingStrategy`, with no `implements` needed. This is why a one-method strategy can
collapse into a plain function.

**Delegation**
: Holding another object and forwarding work to it, instead of inheriting or branching. The
mechanism behind Strategy's context — and the reason the algorithm can change at run time.

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

**Strategy**
: Defines a family of interchangeable algorithms behind one interface, so the algorithm can vary
independently of the code using it (GoF). See the [cheat sheet](strategy-pattern.md).

**Factory Method**
: Declares a creating method in a base class and lets subclasses decide which class to
instantiate (GoF). See the [cheat sheet](factory-method-pattern.md).

**Abstract Factory**
: Provides one interface for creating a family of related objects without naming their concrete
classes (GoF). Composition where Factory Method uses inheritance. See the
[cheat sheet](abstract-factory-pattern.md).

---

Canonical source: *Design Patterns*, Gamma, Helm, Johnson & Vlissides (1994).
