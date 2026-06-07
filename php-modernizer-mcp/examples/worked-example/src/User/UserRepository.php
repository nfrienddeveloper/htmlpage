<?php

declare(strict_types=1);

namespace Worked\User;

/**
 * Persistence behind an abstraction (Repository). Callers depend on this
 * interface, not on a connection or SQL — so the storage engine is swappable
 * and the domain is testable with an in-memory double.
 */
interface UserRepository
{
    public function findByEmail(Email $email): ?User;

    public function save(User $user): void;
}
