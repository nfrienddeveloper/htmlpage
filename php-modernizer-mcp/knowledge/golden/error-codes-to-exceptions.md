# Golden Example: error codes / mixed returns → typed exceptions + value object

Rules: `error-codes`, `error-suppression`. Authority: Fowler (Replace Error Code
with Exception). Principles: LSP, SRP.

## Before (procedural)

```php
<?php
function parse_amount($input) {
    if (!is_numeric($input)) return false;     // false on bad input
    $cents = (int) round($input * 100);
    if ($cents < 0) return -1;                 // -1 on negative
    return $cents;                             // int on success — three return shapes
}

$amount = parse_amount($_GET['amount']);
if ($amount === false || $amount === -1) { /* callers must remember both codes */ }
```

Smell: three return shapes (`false`, `-1`, `int`); every caller must know the
sentinel protocol, and `=== false` vs `== false` bugs lurk.

## After (OOP)

```php
<?php
declare(strict_types=1);

namespace App\Money;

final class InvalidAmount extends \DomainException {}

final readonly class Money
{
    private function __construct(public int $cents) {}

    /** @throws InvalidAmount */
    public static function fromInput(string $input): self
    {
        if (!is_numeric($input)) {
            throw new InvalidAmount("Not a number: {$input}");
        }
        $cents = (int) round((float) $input * 100);
        if ($cents < 0) {
            throw new InvalidAmount('Amount may not be negative');
        }
        return new self($cents);
    }
}

// Caller: one happy path; failures are exceptions handled at the boundary.
try {
    $money = Money::fromInput((string) ($request->getQueryParams()['amount'] ?? ''));
} catch (InvalidAmount $e) {
    return $responder->badRequest($e->getMessage());
}
```

## Mapping
| Change | Rule | Authority |
|---|---|---|
| `return false`/`-1` → typed exceptions | error-codes | Fowler |
| sentinel checks → single try/catch at boundary | error-codes | Fowler |
| validation + value live together | (Value Object) | DDD / Fowler |
| immutable `readonly` | (modern PHP) | PHP 8.1 |

## When NOT to apply
Don't throw for ordinary, expected control flow that the immediate caller always
handles (e.g. "cache miss") — a Null Object or an explicit optional/result type
can be clearer than exceptions for non-exceptional cases.
