# Writing Good Tests

Supporting material for `/create-feature`. Reference this when writing tests during the RED phase.

---

## Good Test Characteristics

A good test is:

- **Descriptive** -- the test name tells you what behavior is being verified, without reading the body
- **Single-assertion** -- tests one behavior, so a failure points to exactly one problem
- **Fast** -- milliseconds, not seconds. Slow tests don't get run
- **Deterministic** -- same result every time, no flakiness from timing, network, or randomness
- **Independent** -- no test depends on another test running first or leaving state behind

---

## Test Naming

Use names that describe the scenario and expected behavior:

```
test_[scenario]_should_[expected_behavior]

  or

test_[given]_when_[action]_then_[result]
```

### BAD vs GOOD

| BAD (describes implementation) | GOOD (describes behavior) |
|-------------------------------|--------------------------|
| `test_calculate_method` | `test_empty_cart_returns_zero_total` |
| `test_user_service` | `test_user_cannot_login_with_expired_token` |
| `test_validation` | `test_email_without_at_sign_is_rejected` |
| `test_process_order` | `test_out_of_stock_item_returns_backorder_status` |
| `test_handler` | `test_unauthenticated_request_returns_401` |

The test name should read like a specification. If you delete all the code and keep only the test names, they should describe exactly what the system does.

---

## Arrange-Act-Assert

Every test follows three sections with clear separation:

```python
def test_expired_token_returns_401():
    # Arrange -- set up the preconditions
    token = create_token(expires_at=one_hour_ago())
    request = build_request(auth_token=token)

    # Act -- perform the single action under test
    response = handle_request(request)

    # Assert -- verify the expected outcome
    assert response.status_code == 401
    assert response.body["error"] == "token_expired"
```

Rules:
- **One Act per test.** If you need two Acts, you need two tests.
- **Arrange can be long** -- that's fine. Complex setup is better than complex assertions.
- **Assert should be obvious** -- if the assertion needs a comment, the test name is wrong.

---

## What to Test in Each Slice

Each tracer bullet adds one behavior. The test for that slice covers ONLY that behavior:

```
Slice 1: Create order with valid items
  Test: test_valid_items_creates_order_with_pending_status

Slice 2: Reject order with empty cart
  Test: test_empty_cart_returns_validation_error

Slice 3: Calculate order total with tax
  Test: test_order_total_includes_state_tax
```

Do NOT write all tests upfront. Write the test for the current slice, make it pass, then move to the next slice.

---

## Edge Cases to Always Consider

When writing tests for a slice, ask whether these edge cases apply:

| Category | Examples |
|----------|---------|
| **Empty/null inputs** | Empty string, null, empty list, zero |
| **Boundary values** | Off-by-one, max int, max length, exactly at limit |
| **Concurrent access** | Two users modifying the same resource |
| **Error paths** | Network timeout, invalid format, permission denied |
| **Unicode/encoding** | Non-ASCII characters, emoji, RTL text |
| **Large inputs** | 10k items in list, 1MB payload, deeply nested JSON |

Not every slice needs every edge case. But every slice should consider whether any apply.

---

## Test Data

### Use Builders or Factories

```python
# BAD -- raw constructors with irrelevant details
user = User(
    id=1, name="Test", email="test@example.com",
    created_at=datetime.now(), updated_at=datetime.now(),
    role="admin", active=True, department="engineering"
)

# GOOD -- builder with defaults, override only what matters
user = build_user(role="admin")
```

### Keep Test Data Close to the Test

```python
# BAD -- test data in a separate fixtures file 200 lines away
def test_order_total():
    order = FIXTURES["standard_order"]  # what's in this?
    assert order.total == 42.50

# GOOD -- test data is right here
def test_order_total():
    order = build_order(items=[
        build_item(price=10.00, quantity=2),
        build_item(price=22.50, quantity=1),
    ])
    assert order.total == 42.50
```

When the test data is visible in the test, the test is self-documenting. When it lives elsewhere, the reader has to jump between files to understand what's being tested.
