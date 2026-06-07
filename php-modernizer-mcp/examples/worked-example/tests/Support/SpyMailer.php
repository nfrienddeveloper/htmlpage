<?php

declare(strict_types=1);

namespace Worked\Tests\Support;

use Worked\Notification\Mailer;
use Worked\User\User;

/** Records what would have been sent, so tests can assert on side effects. */
final class SpyMailer implements Mailer
{
    /** @var list<User> */
    public array $sent = [];

    public function sendWelcome(User $user): void
    {
        $this->sent[] = $user;
    }
}
