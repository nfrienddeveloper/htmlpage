<?php

declare(strict_types=1);

namespace Worked\Tests\Support;

use Worked\Clock\Clock;

/** A deterministic clock for tests — the payoff of injecting time. */
final class FixedClock implements Clock
{
    public function __construct(private readonly string $time = '2026-06-07 12:00:00')
    {
    }

    public function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable($this->time);
    }
}
