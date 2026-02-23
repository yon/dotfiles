# Characterization Tests

Supporting material for `/refactor`. Reference this when you need to refactor code that lacks adequate test coverage.

---

## What Is a Characterization Test?

A characterization test captures the CURRENT behavior of code, whether that behavior is correct or not. Its purpose is not to verify correctness -- it's to pin existing behavior so that any refactoring that accidentally changes it will break the test.

Think of it as taking a snapshot: "this is what the code does right now." If the refactoring preserves the snapshot, the refactoring is safe.

---

## When to Write Them

Write characterization tests when:

- You need to refactor code with less than 80% test coverage
- The existing tests don't cover the specific behaviors you're about to change
- You're working with legacy code where the original developers are unavailable
- The code's behavior is complex enough that you can't hold it all in your head

Do NOT write characterization tests when:
- Adequate tests already exist (use those instead)
- You're writing new code (write behavior tests instead)
- The code is so simple that the refactoring is obviously safe

---

## The Process

### Step 1: Call the code with known inputs

Pick representative inputs. Start with the happy path, then cover edge cases you'll encounter during refactoring.

### Step 2: Observe the actual output

Run the code and record what it returns, what side effects it produces, what exceptions it throws. Do not assume -- observe.

### Step 3: Assert that the output matches what you observed

Write a test that asserts the observed behavior. The assertion is based on reality, not on what the code "should" do.

### Step 4: This "pins" the behavior

Any refactoring that changes the output will now break this test. That's the safety net.

---

## Example

```python
def test_characterize_calculate_tax():
    """Characterization test -- captures current behavior, not necessarily correct behavior."""
    # These assertions were derived by running the function and observing output.
    # They pin existing behavior for safe refactoring.

    assert calculate_tax(subtotal=100.00, state="CA") == 8.25
    assert calculate_tax(subtotal=100.00, state="OR") == 0.0
    assert calculate_tax(subtotal=0.00, state="CA") == 0.0
    assert calculate_tax(subtotal=-50.00, state="CA") == -4.125  # negative -- possibly a bug

def test_characterize_calculate_tax_unknown_state():
    """Characterization: unknown state returns 0 tax (no exception)."""
    assert calculate_tax(subtotal=100.00, state="XX") == 0.0

def test_characterize_calculate_tax_none_state():
    """Characterization: None state raises TypeError."""
    with pytest.raises(TypeError):
        calculate_tax(subtotal=100.00, state=None)
```

Notice: the negative tax result is probably a bug. The characterization test captures it anyway. The goal is not to fix bugs during refactoring -- it's to preserve existing behavior.

---

## Key Insight: Stability, Not Correctness

Characterization tests answer: **"What does this code actually do?"** -- not "What should this code do?"

This distinction matters because:

- If you refactor and a characterization test breaks, you've accidentally changed behavior
- If the existing behavior has bugs, the characterization test will encode those bugs
- That's intentional -- you want to know if your refactoring changed ANYTHING, even buggy behavior

Fixing bugs is a separate step. Refactoring and bug fixing never happen in the same commit.

---

## Naming Convention

Prefix characterization tests clearly so they're distinguishable from behavior tests:

```
test_characterize_[function_name]_[scenario]

  or

test_pin_[function_name]_[scenario]
```

This signals to future readers: "this test exists to pin behavior for refactoring, not to document correct behavior."

---

## After Refactoring

Once the refactoring is complete and all characterization tests pass:

1. **Review each characterization test** -- does it test useful behavior?
2. **Promote useful ones** -- rename to proper behavior test names, update assertions if you now understand the intent better
3. **Remove redundant ones** -- if the behavior is already covered by existing tests
4. **Flag suspicious ones** -- if a characterization test encodes buggy behavior, create a ticket/issue to fix the bug separately

---

## Warning: Encoded Bugs

If the current behavior has bugs, characterization tests will faithfully encode those bugs. This is correct and intentional.

```python
def test_characterize_shipping_negative_weight():
    """BUG: negative weight returns negative shipping cost.
    This is a known bug -- tracked in issue #234.
    Characterization test preserves current behavior during refactoring.
    Fix the bug separately after refactoring is complete."""
    assert calculate_shipping(weight=-5.0) == -2.50
```

Document known bugs in the test docstring. Fix them in a separate commit after the refactoring is done and reviewed.
