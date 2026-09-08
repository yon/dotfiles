# Refactoring catalog

Choose moves that solve an observed structural problem. File length, parameter count, and
inheritance depth can prompt investigation, but do not justify a transformation on their own.
Preserve observable behavior and public compatibility required by the task.

## Extract function

Use when a cohesive operation deserves a name or reuse. Identify inputs, outputs, mutations, early
returns, and exceptions; extract without changing evaluation order or variable lifetime. Check the
original caller as well as the extracted operation.

## Extract module or class

Use when responsibilities form distinct cohesive groups. Move their dependencies together, update
callers, and preserve required exports. Check import cycles, initialization order, shared state, and
packaging or discovery rules.

## Rename

Use when a name obscures intent. Update symbol references with available language tooling and search
for uses it may miss: strings, configuration, reflection, serialized fields, command names, and
external consumers. Preserve required public names or handle a public rename as an explicit API
change.

## Inline

Use when an indirection adds no useful meaning or boundary. Check all callers before removing it.
Preserve evaluation count, argument evaluation order, short-circuit behavior, and side effects;
substituting an expression twice can change behavior.

## Move

Use when code belongs nearer the responsibility or data it serves. Update imports and callers;
preserve required public import paths. Verify initialization order and dependency direction,
especially for stateful modules.

## Replace conditional with dispatch or polymorphism

Use when genuinely varying behavior benefits from a shared interface. A small table or an unchanged
conditional may be simpler than introducing classes. Preserve defaults, unknown-input handling,
precedence, and evaluation order.

For a pure rate lookup, a table can express the same cases:

```python
# Before
def discount_before(kind, total):
    if kind == "premium":
        return total * 0.20
    if kind == "regular":
        return total * 0.10
    return 0

# After: the public contract restricts kind to strings.
RATES = {"premium": 0.20, "regular": 0.10}

def discount_after(kind, total):
    rate = RATES.get(kind)
    return 0 if rate is None else total * rate
```

The fallback still returns zero without multiplying total. Verify the input contract before applying
this move: a dictionary lookup requires a hashable key, whereas equality comparisons may accept
other inputs.

## Introduce parameter object

Use when parameters form a stable domain concept or repeatedly travel together. Preserve defaults,
validation timing, optional values, and call compatibility. Avoid a new object solely to reduce a
parameter count.

## Name a literal

Use when a value has domain meaning that its name can clarify. Replace only occurrences with that
meaning; identical numeric or string values may represent unrelated concepts. Preserve type, units,
and boundary comparisons.

## Decompose conditional

Use when named predicates clarify policy. Preserve short-circuiting and call order. Eagerly
assigning every predicate to a local variable may trigger work or errors that the original
expression skipped.

## Replace inheritance with composition

Use when the relationship needs independently varying collaborators or inheritance creates unwanted
coupling. Inventory inherited behavior and external uses of the base type before changing it.
Preserve operation order and exception propagation; do not introduce new formatting, validation, or
logging during the move.

This example transfers an existing operation without adding side effects:

```python
# Before
def send_before(formatter, validator, logger, client, message):
    formatted = formatter(message)
    validator(message)
    client(formatted)
    logger(message)

# After: a collaborator owns the same operation.
class Delivery:
    def __init__(self, formatter, validator, logger, client):
        self.formatter = formatter
        self.validator = validator
        self.logger = logger
        self.client = client

    def send(self, message):
        formatted = self.formatter(message)
        self.validator(message)
        self.client(formatted)
        self.logger(message)
```

When replacing a real base class with this collaborator, also verify constructor behavior,
overridden methods, type checks, and required public attributes. Check both success and failure
paths: if validation or sending fails, later operations must still be skipped as before.
