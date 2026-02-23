# Engineering Principles — Enforcement Rules

**These principles are not aspirational. They are enforced. Every code change is evaluated against them.**

______________________________________________________________________

## 1. DRY — Don't Repeat Yourself

### What It Means

Every piece of knowledge must have a single, unambiguous, authoritative representation in the system.

### Enforcement

- **Detect:** If you see > 5 lines of identical or near-identical logic in two places, flag it
- **Fix:** Extract into a shared function, module, or constant
- **Exception:** Prefer duplication over the wrong abstraction. If the shared logic would require complex parameterization or conditionals to handle different cases, keep it separate until the pattern clarifies. The Rule of Three applies: duplicate once is OK, duplicate twice means refactor.
- **Configuration:** Single source of truth. Config values defined in ONE place (env, config file), referenced everywhere else.
- **Constants:** Named constants, not magic numbers. `MAX_RETRY_ATTEMPTS = 3`, not `3`.

______________________________________________________________________

## 2. KISS — Keep It Simple, Stupid

### What It Means

The simplest correct solution is the best solution. Complexity is a cost that must be justified.

### Enforcement

- **No premature abstraction** — Don't create interfaces/protocols/traits for a single implementation. Wait until you have 2+ concrete implementations.
- **No premature generalization** — Build for today's requirements. Tomorrow's requirements may never come.
- **No unnecessary indirection** — Every layer (service, repository, adapter, facade) must earn its existence. Ask: "What breaks if I remove this layer?"
- **Readable over clever** — A straightforward `for` loop beats a chain of `map.filter.reduce` if the latter is harder to follow.
- **Function length** — If a function exceeds ~30 lines, consider splitting. If it exceeds 50, definitely split. But don't split into tiny fragments that obscure flow.
- **File length** — If a file exceeds ~300 lines, consider whether it has multiple responsibilities.

______________________________________________________________________

## 3. SOLID Principles

### Single Responsibility (SRP)

- Each module/class/function does ONE thing well
- **Test:** Can you describe what this module does WITHOUT using "and"?
- **Smell:** A class that imports from 5+ unrelated domains

### Open/Closed (OCP)

- Extend behavior without modifying existing, tested code
- **Pattern:** Strategy pattern, plugin architecture, event handlers
- **Anti-pattern:** Modifying a working function to add one more `if` branch

### Liskov Substitution (LSP)

- Subtypes must honor the contract of their base types
- **Test:** Can you swap any subclass for its parent without breaking callers?
- **Smell:** Overriding a method to throw "not implemented"

### Interface Segregation (ISP)

- Prefer small, focused interfaces over large ones
- **Test:** Does every implementer use ALL methods of the interface?
- **Fix:** Split large interfaces into role-specific ones

### Dependency Inversion (DIP)

- High-level modules depend on abstractions, not low-level details
- **Pattern:** Constructor injection, function parameters, protocol/interface types
- **Anti-pattern:** Importing a concrete database client inside business logic

______________________________________________________________________

## 4. Immutability by Default

### What It Means

Data should not change after creation unless there is a compelling performance reason.

### Enforcement

- **Variables:** Use `const`, `final`, `let` (not `var`), `readonly`, or equivalent by default
- **Data structures:** Prefer frozen/immutable collections. Use `tuple` over `list`, `frozenset` over `set`, `Readonly<T>` over `T`, etc.
- **Function parameters:** Never mutate inputs. Return new values.
- **State management:** If state must change, use controlled patterns (state machines, reducers, event sourcing)
- **When mutation is OK:** Hot paths where profiling proves allocation overhead matters. Document with a comment: `// PERF: mutating in-place to avoid allocation in tight loop`

______________________________________________________________________

## 5. Strong Typing

### What It Means

Use the type system to make illegal states unrepresentable. Types are documentation that the compiler checks.

### Enforcement

- **No `any` / `interface{}` / `object` / `dynamic`** without documented justification
- **Domain types:** `UserId` not `string`, `EmailAddress` not `string`, `Money` not `float`
- **Enums over strings:** `Status.ACTIVE` not `"active"`. This catches typos at compile time.
- **Union/Sum types:** `Result<T, E>` or `Either<L, R>` for operations that can fail. Optionals for nullable values.
- **Strict mode:** Enable `strict: true` (TypeScript), `--strict` (mypy), `-Wall -Werror` (C/C++), `#![deny(warnings)]` (Rust), or equivalent.
- **Generics:** Use generics to maintain type safety across abstractions. Don't cast to bypass type checks.

______________________________________________________________________

## 6. Dependency Injection

### What It Means

Modules receive their dependencies from the outside rather than creating or looking them up internally.

### Enforcement

- **Constructor/Parameter injection:** Pass deps as constructor arguments or function parameters
- **No global state:** Avoid singletons, module-level mutable variables, and service locators
- **No hidden I/O:** Functions that perform I/O should receive the I/O mechanism as a parameter (or be clearly marked as I/O at the boundary)
- **Testability test:** Can you test this function by passing mock/stub dependencies? If not, refactor.
- **Configuration:** Loaded once at the entrypoint, then passed down. Inner modules never read env vars directly.

______________________________________________________________________

## 7. Composition Over Inheritance

### What It Means

Build complex behavior by combining simple, focused components rather than through deep class hierarchies.

### Enforcement

- **Max inheritance depth:** 2 levels (base → concrete). If you need more, use composition.
- **Prefer has-a over is-a:** `User` has a `Logger`, not `User extends Loggable`
- **Mixins/Traits:** Acceptable for cross-cutting concerns (serialization, comparison) but keep them small
- **Pattern:** Strategy, Decorator, and Observer patterns over template method hierarchies

______________________________________________________________________

## 8. Fail Fast

### What It Means

Detect and report errors as early as possible. Invalid input should be rejected at the boundary, not propagated through the system to fail mysteriously later.

### Enforcement

- **Validate at boundaries:** HTTP handlers, CLI parsers, message consumers validate inputs FIRST
- **Assertions for invariants:** Use assertions for conditions that should NEVER be false. If they fire, it's a bug.
- **No silent failures:** Never catch an exception and do nothing. Log, re-raise, or return an error.
- **Parse, don't validate:** Convert untyped data to typed domain objects at the boundary. After that point, the type system guarantees validity.

### Context in Errors

Every error message should include enough context to diagnose the issue without reproducing it:

- **Operation** — what was being attempted
- **Inputs** — the relevant data (sanitized of secrets)
- **Expected outcome** — what should have happened
- **Actual outcome** — what actually happened

```
BAD:  "Failed to process order"
GOOD: "Failed to process order #12345: payment gateway returned 503 for charge of $49.99 (customer: user_abc, gateway: stripe)"
```

Cross-reference: See `code-conventions.md` for context-rich output patterns and observability standards.

______________________________________________________________________

## 9. Separation of Concerns

### What It Means

Different concerns (I/O, business logic, presentation, persistence) should live in different modules.

### Enforcement

- **Pure core, impure shell:** Business logic is pure (no I/O, no side effects). I/O happens at the edges.
- **No business logic in controllers/handlers:** They orchestrate, they don't decide.
- **No SQL in service layer:** Data access is behind a repository/data layer.
- **No HTTP concepts in domain layer:** The domain doesn't know about requests, responses, or status codes.

______________________________________________________________________

## 10. Explicit Over Implicit

### What It Means

Code should do what it says and say what it does. No magic, no hidden behavior, no surprises.

### Enforcement

- **No implicit conversions** that change semantics
- **No default arguments** that hide important behavior
- **Name side effects:** If a function sends email, its name includes "send" or "notify"
- **Return values, don't print:** Functions return results; callers decide what to do with them
- **Configuration is explicit:** Feature flags, behavior switches, and environment-specific logic are clearly labeled, not buried in conditionals
