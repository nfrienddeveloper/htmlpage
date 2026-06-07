<?php

declare(strict_types=1);

namespace Worked\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Worked\User\Email;
use Worked\User\InvalidEmail;

final class EmailTest extends TestCase
{
    public function testNormalizesValidEmail(): void
    {
        $email = Email::fromString('  Boss@Example.COM ');

        self::assertSame('boss@example.com', $email->value);
        self::assertSame('boss@example.com', (string) $email);
    }

    public function testRejectsInvalidEmail(): void
    {
        $this->expectException(InvalidEmail::class);
        Email::fromString('not-an-email');
    }
}
