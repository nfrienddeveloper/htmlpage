<?php

declare(strict_types=1);

namespace Worked\User;

/**
 * Domain entity. Immutable, fully typed, framework-free — no idea the database
 * or HTTP exist.
 */
final readonly class User
{
    public function __construct(
        public Email $email,
        public string $name,
        public \DateTimeImmutable $registeredAt,
    ) {
    }
}
