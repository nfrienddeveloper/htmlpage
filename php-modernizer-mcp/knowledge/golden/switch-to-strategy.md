# Golden Example: switch-on-type → Strategy + Factory

Rule: `switch-on-type`. Authority: Fowler (Replace Conditional with Polymorphism),
GoF Strategy. Principles: OCP, LSP.

## Before (procedural)

```php
<?php
function calculate_shipping($order, $method) {
    switch ($method) {
        case 'standard': return $order['weight'] * 1.5;
        case 'express':  return $order['weight'] * 3.0 + 5;
        case 'pickup':   return 0.0;
        default: throw new InvalidArgumentException("Unknown method $method");
    }
}
```

Smell: the same `switch ($method)` appears in shipping, labels, and ETA code —
adding a method means editing every switch (OCP violation).

## After (OOP)

```php
<?php
declare(strict_types=1);

namespace App\Shipping;

interface ShippingMethod
{
    public function cost(Order $order): Money;
}

final class StandardShipping implements ShippingMethod
{
    public function cost(Order $order): Money
    {
        return Money::fromFloat($order->weight() * 1.5);
    }
}

final class ExpressShipping implements ShippingMethod
{
    public function cost(Order $order): Money
    {
        return Money::fromFloat($order->weight() * 3.0 + 5);
    }
}

final class Pickup implements ShippingMethod
{
    public function cost(Order $order): Money
    {
        return Money::zero();
    }
}

final class ShippingMethodFactory
{
    /** @param array<string, ShippingMethod> $methods */
    public function __construct(private readonly array $methods) {}

    public function for(string $code): ShippingMethod
    {
        return $this->methods[$code]
            ?? throw new UnknownShippingMethod($code);
    }
}
```

Now adding a method = a new class + one container line. No existing code changes (OCP).

## Mapping
| Change | Rule | Authority |
|---|---|---|
| `switch` → interface + implementations | switch-on-type | Fowler / GoF Strategy |
| `default: throw` → factory throws typed exc | error-codes | Fowler |
| primitive return → `Money` value object | (primitive obsession) | DDD / Fowler |

## When NOT to apply (restraint)
If the switch has 2–3 stable branches that appear in exactly one place and rarely
change, a `match` expression is the right modern tool — a Strategy hierarchy here
is over-engineering (see `anti-patterns.md`). Apply Strategy when the switch is
**duplicated** or **volatile** (Rule of Three).
