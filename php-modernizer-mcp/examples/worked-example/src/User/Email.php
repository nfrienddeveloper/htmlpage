<?php

declare(strict_types=1);

namespace Worked\User;

/**
 * Value object: an email is always valid by construction, normalized, and
 * immutable. Validation lives WITH the data instead of being re-checked in
 * every procedure.
 */
final readonly class Email
{
    private function __construct(public string $value)
    {
    }

    /** @throws InvalidEmail */
    public static function fromString(string $raw): self
    {
        $email = trim($raw);
        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            throw new InvalidEmail("Invalid email address: {$raw}");
        }

        return new self(strtolower($email));
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
