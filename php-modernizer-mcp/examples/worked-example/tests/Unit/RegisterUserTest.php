<?php

declare(strict_types=1);

namespace Worked\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Worked\Tests\Support\FixedClock;
use Worked\Tests\Support\SpyMailer;
use Worked\User\DuplicateUser;
use Worked\User\InMemoryUserRepository;
use Worked\User\InvalidEmail;
use Worked\User\RegisterUser;

final class RegisterUserTest extends TestCase
{
    private InMemoryUserRepository $repo;
    private SpyMailer $mailer;
    private RegisterUser $register;

    protected function setUp(): void
    {
        $this->repo = new InMemoryUserRepository();
        $this->mailer = new SpyMailer();
        $this->register = new RegisterUser(
            $this->repo,
            $this->mailer,
            new FixedClock('2026-06-07 09:00:00'),
        );
    }

    public function testRegistersUserAndSendsWelcome(): void
    {
        $user = ($this->register)('jane@example.com', '  Jane  ');

        self::assertSame('jane@example.com', $user->email->value);
        self::assertSame('Jane', $user->name);
        self::assertSame('2026-06-07 09:00:00', $user->registeredAt->format('Y-m-d H:i:s'));
        self::assertNotNull($this->repo->findByEmail($user->email));
        self::assertCount(1, $this->mailer->sent);
    }

    public function testRejectsDuplicateRegistration(): void
    {
        ($this->register)('dup@example.com', 'First');

        $this->expectException(DuplicateUser::class);
        ($this->register)('dup@example.com', 'Second');
    }

    public function testInvalidEmailCausesNoSideEffects(): void
    {
        try {
            ($this->register)('nope', 'X');
            self::fail('Expected InvalidEmail to be thrown');
        } catch (InvalidEmail) {
            self::assertCount(0, $this->mailer->sent, 'No welcome email on failure');
        }
    }
}
