<?php

declare(strict_types=1);

// Use Composer's autoloader if present, otherwise the zero-dependency one.
$vendor = __DIR__ . '/../vendor/autoload.php';
require is_file($vendor) ? $vendor : __DIR__ . '/../autoload.php';

use Worked\Clock\SystemClock;
use Worked\Notification\Mailer;
use Worked\User\DuplicateUser;
use Worked\User\InMemoryUserRepository;
use Worked\User\InvalidEmail;
use Worked\User\RegisterUser;
use Worked\User\User;

$mailer = new class implements Mailer {
    public function sendWelcome(User $user): void
    {
        echo "  → welcome email queued for {$user->email}\n";
    }
};

$register = new RegisterUser(new InMemoryUserRepository(), $mailer, new SystemClock());

echo "Registering a user through the modernized OOP use-case:\n";
$user = $register('boss@example.com', 'The Boss');
echo "  ✓ {$user->name} <{$user->email}> at {$user->registeredAt->format(DATE_ATOM)}\n\n";

echo "Bad input is a typed exception, not a silent `return false`:\n";
try {
    $register('not-an-email', 'Nope');
} catch (InvalidEmail $e) {
    echo "  ✓ caught InvalidEmail: {$e->getMessage()}\n";
}

echo "\nDuplicates are rejected, with no side effects:\n";
try {
    $register('boss@example.com', 'Impostor');
} catch (DuplicateUser $e) {
    echo "  ✓ caught DuplicateUser: {$e->getMessage()}\n";
}
