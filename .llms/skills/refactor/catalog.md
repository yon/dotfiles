# Refactoring Catalog

Supporting material for `/refactor`. Reference this when choosing and executing refactoring moves.

Each move below includes: when to apply, the micro-steps, a before/after example, and what to verify.

---

## Extract Function

**When:** A function is too long (>30 lines), or a block of code has a clear purpose that deserves a name.

**Steps:**
1. Identify the block of code to extract
2. Determine what variables it reads (parameters) and writes (return values)
3. Create a new function with a descriptive name
4. Move the block into the new function
5. Replace the original block with a call to the new function
6. Run tests

**Before:**
```python
def process_order(order):
    # ... 20 lines of validation ...
    if not order.items:
        raise ValueError("Order must have items")
    for item in order.items:
        if item.quantity <= 0:
            raise ValueError(f"Invalid quantity for {item.name}")
        if item.price < 0:
            raise ValueError(f"Invalid price for {item.name}")
    # ... 30 lines of processing ...
```

**After:**
```python
def process_order(order):
    validate_order(order)
    # ... 30 lines of processing ...

def validate_order(order):
    if not order.items:
        raise ValueError("Order must have items")
    for item in order.items:
        if item.quantity <= 0:
            raise ValueError(f"Invalid quantity for {item.name}")
        if item.price < 0:
            raise ValueError(f"Invalid price for {item.name}")
```

**Verify:** Tests pass. The extracted function is called from the original location. No behavior change.

---

## Extract Module/Class

**When:** A file has multiple responsibilities. You can identify two or more cohesive groups of functions that belong together.

**Steps:**
1. Identify the cohesive group to extract
2. Create the new file/module
3. Move the functions and their dependencies
4. Update imports in the original file
5. Update imports in all callers
6. Run tests

**Before:**
```
user.py (400 lines)
  - User model
  - User validation
  - User serialization
  - User notification logic
  - User permission checks
```

**After:**
```
user_model.py        -- User model + validation
user_serializer.py   -- serialization/deserialization
user_notifications.py -- notification logic
user_permissions.py   -- permission checks
```

**Verify:** Tests pass. All imports resolve. No circular dependencies introduced.

---

## Rename

**When:** A name doesn't reveal intent. You need to read the implementation to understand what something does.

**Steps:**
1. Choose a name that reveals intent
2. Rename the symbol (function, variable, class, file)
3. Update all references (IDE rename or project-wide search)
4. Run tests

**Before:**
```python
def proc(d, t):
    return d * (1 + t)
```

**After:**
```python
def calculate_total_with_tax(subtotal, tax_rate):
    return subtotal * (1 + tax_rate)
```

**Verify:** Tests pass. No references to the old name remain. Grep the codebase for the old name.

---

## Inline

**When:** An indirection (function, variable, class) adds no value. The wrapper is more confusing than the code it wraps.

**Steps:**
1. Find all callers of the function/variable
2. Replace each call with the inlined implementation
3. Remove the now-unused function/variable
4. Run tests

**Before:**
```python
def get_user_name(user):
    return user.name

# Used once:
display_name = get_user_name(current_user)
```

**After:**
```python
display_name = current_user.name
```

**Verify:** Tests pass. The removed function had no other callers.

---

## Move

**When:** Code is in the wrong module. A function accesses another module's data more than its own.

**Steps:**
1. Identify the better home for the code
2. Move the function/class to the new location
3. Update the import in the old location (re-export if needed for backward compatibility)
4. Update all callers
5. Run tests

**Before:**
```python
# In order_service.py
def calculate_shipping(address):
    # Uses only shipping-related logic, nothing from order_service
    ...
```

**After:**
```python
# In shipping_service.py
def calculate_shipping(address):
    ...
```

**Verify:** Tests pass. The function is closer to its dependencies. No circular imports.

---

## Replace Conditional with Polymorphism

**When:** A long if/switch chain dispatches on type. Adding a new type requires modifying the existing function.

**Steps:**
1. Create an interface/protocol/base class
2. Create a concrete class for each branch of the conditional
3. Move each branch's logic into its concrete class
4. Replace the conditional with a dispatch to the appropriate class
5. Run tests

**Before:**
```python
def calculate_discount(customer):
    if customer.type == "premium":
        return customer.total * 0.20
    elif customer.type == "regular":
        return customer.total * 0.10
    elif customer.type == "employee":
        return customer.total * 0.30
    else:
        return 0
```

**After:**
```python
class PremiumDiscount:
    def calculate(self, total): return total * 0.20

class RegularDiscount:
    def calculate(self, total): return total * 0.10

class EmployeeDiscount:
    def calculate(self, total): return total * 0.30

DISCOUNT_STRATEGIES = {
    "premium": PremiumDiscount(),
    "regular": RegularDiscount(),
    "employee": EmployeeDiscount(),
}

def calculate_discount(customer):
    strategy = DISCOUNT_STRATEGIES.get(customer.type)
    return strategy.calculate(customer.total) if strategy else 0
```

**Verify:** Tests pass. Adding a new type requires only adding a new class and a dictionary entry -- no modification of existing logic.

---

## Introduce Parameter Object

**When:** A function has 5+ parameters, or the same group of parameters appears in multiple functions.

**Steps:**
1. Create a data class/struct for the parameter group
2. Update the function signature to accept the new object
3. Update all callers to construct the object
4. Run tests

**Before:**
```python
def create_order(customer_id, shipping_address, billing_address,
                 payment_method, currency, discount_code):
    ...
```

**After:**
```python
@dataclass
class CreateOrderRequest:
    customer_id: str
    shipping_address: Address
    billing_address: Address
    payment_method: str
    currency: str
    discount_code: str | None = None

def create_order(request: CreateOrderRequest):
    ...
```

**Verify:** Tests pass. All callers updated. The parameter object groups related data.

---

## Replace Magic Number/String

**When:** A literal value appears in code without explanation. The reader must guess what it means.

**Steps:**
1. Identify the literal and its meaning
2. Create a named constant
3. Replace all occurrences of the literal with the constant
4. Run tests

**Before:**
```python
if retry_count > 3:
    raise TimeoutError()
time.sleep(0.5)
```

**After:**
```python
MAX_RETRY_ATTEMPTS = 3
RETRY_DELAY_SECONDS = 0.5

if retry_count > MAX_RETRY_ATTEMPTS:
    raise TimeoutError()
time.sleep(RETRY_DELAY_SECONDS)
```

**Verify:** Tests pass. The constant name explains the value's purpose.

---

## Decompose Conditional

**When:** A boolean expression is complex enough that you need to trace it mentally to understand what it checks.

**Steps:**
1. Extract each part of the condition into a named variable or function
2. Replace the complex condition with the named parts
3. Run tests

**Before:**
```python
if (user.role == "admin" or (user.role == "manager" and user.department == dept)) \
   and not user.suspended and user.last_login > thirty_days_ago:
    grant_access()
```

**After:**
```python
def has_department_access(user, dept):
    return user.role == "admin" or (user.role == "manager" and user.department == dept)

def is_active_account(user):
    return not user.suspended and user.last_login > thirty_days_ago

if has_department_access(user, dept) and is_active_account(user):
    grant_access()
```

**Verify:** Tests pass. The condition reads like English. Each predicate function is independently testable.

---

## Replace Inheritance with Composition

**When:** Inheritance hierarchy is deeper than 2 levels, or subclasses override most parent behavior, or you need to combine behaviors from multiple "parents."

**Steps:**
1. Identify what the subclass actually uses from the parent
2. Create a component class for that behavior
3. Give the original class an instance of the component (has-a, not is-a)
4. Delegate calls to the component
5. Remove the inheritance relationship
6. Run tests

**Before:**
```python
class EmailNotifier(BaseNotifier):
    # Inherits: format_message, validate_recipient, log_notification
    # Overrides: send (the only method that differs)
    def send(self, message):
        self.email_client.send(message)
```

**After:**
```python
class EmailNotifier:
    def __init__(self, formatter, validator, logger, email_client):
        self.formatter = formatter
        self.validator = validator
        self.logger = logger
        self.email_client = email_client

    def send(self, message):
        formatted = self.formatter.format(message)
        self.validator.validate(message.recipient)
        self.email_client.send(formatted)
        self.logger.log(message)
```

**Verify:** Tests pass. The class no longer depends on a parent class. Behaviors can be mixed and matched via composition.
