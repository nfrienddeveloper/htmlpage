<?php

declare(strict_types=1);

namespace Worked\Clock;

/**
 * Time as an injected dependency (PSR-20 shaped). Replaces hidden date()/time()
 * calls so behavior is deterministic and testable.
 */
interface Clock
{
    public function now(): \DateTimeImmutable;
}
