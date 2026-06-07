<?php

declare(strict_types=1);

namespace Worked\Notification;

use Worked\User\User;

/**
 * Notification behind an interface. Replaces the bare mail() call so the side
 * effect is injected and verifiable (a spy in tests, a real SMTP mailer in
 * production).
 */
interface Mailer
{
    public function sendWelcome(User $user): void;
}
