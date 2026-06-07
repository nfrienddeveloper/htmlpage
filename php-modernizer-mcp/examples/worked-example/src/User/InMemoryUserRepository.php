<?php

declare(strict_types=1);

namespace Worked\User;

/**
 * A real, usable implementation that needs no database — perfect for tests and
 * a demo. A PdoUserRepository would implement the same interface with prepared
 * statements (see knowledge/golden/inline-sql-to-repository.md).
 */
final class InMemoryUserRepository implements UserRepository
{
    /** @var array<string, User> */
    private array $byEmail = [];

    public function findByEmail(Email $email): ?User
    {
        return $this->byEmail[$email->value] ?? null;
    }

    public function save(User $user): void
    {
        $this->byEmail[$user->email->value] = $user;
    }
}
