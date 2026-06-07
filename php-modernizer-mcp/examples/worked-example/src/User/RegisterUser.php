<?php

declare(strict_types=1);

namespace Worked\User;

use Worked\Clock\Clock;
use Worked\Notification\Mailer;

/**
 * The use-case (domain action). All collaborators are injected; it has one
 * responsibility, no globals, no echo, no SQL, no hidden time. Errors are
 * exceptions, the result is a typed object. This is the heart of the
 * modernization.
 */
final readonly class RegisterUser
{
    public function __construct(
        private UserRepository $users,
        private Mailer $mailer,
        private Clock $clock,
    ) {
    }

    /**
     * @throws InvalidEmail  when the address is not valid
     * @throws DuplicateUser when the email is already registered
     */
    public function __invoke(string $rawEmail, string $name): User
    {
        $email = Email::fromString($rawEmail);

        if ($this->users->findByEmail($email) !== null) {
            throw new DuplicateUser("Already registered: {$email}");
        }

        $user = new User($email, trim($name), $this->clock->now());

        $this->users->save($user);
        $this->mailer->sendWelcome($user);

        return $user;
    }
}
