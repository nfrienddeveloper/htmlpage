# Golden Example: globals + procedural functions → injected OOP service

A reference "before/after" the expert pattern-matches against. Add more golden
files (one concern each) to train the expert with your house style.

## Before (procedural, the legacy shape)

```php
<?php
// user_functions.php  — included everywhere, relies on $db global, echoes, uses date()

require_once 'db.php'; // sets up global $db

function register_user($email, $name) {
    global $db;
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "Bad email";
        return false;
    }
    $created = date('Y-m-d H:i:s');
    $db->query("INSERT INTO users (email, name, created) VALUES ('$email', '$name', '$created')");
    mail($email, "Welcome", "Hi $name");
    return true;
}
```

Smells: `global $db`, inline SQL + injection risk, `echo` in logic, `date()`
hidden dependency, `mail()` hidden dependency, error-by-`false`, no types.

## After (OOP, the target shape)

```php
<?php
declare(strict_types=1);

namespace App\User;

use App\User\Email;            // value object (validation lives here)
use App\User\UserRepository;   // persistence isolated behind an interface
use App\Notification\Mailer;   // notification behind an interface
use Psr\Clock\ClockInterface;  // PSR-20 — time is injected, testable

final class RegisterUser
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly Mailer $mailer,
        private readonly ClockInterface $clock,
    ) {}

    /** @throws InvalidEmail */
    public function __invoke(Email $email, string $name): User
    {
        $user = new User($email, $name, $this->clock->now());
        $this->users->save($user);            // parameterized query inside repo
        $this->mailer->sendWelcome($user);    // injected, mockable
        return $user;                         // typed return, exceptions for errors
    }
}
```

## What changed, mapped to authority

| Move                                   | Rule id              | Authority                        |
|----------------------------------------|----------------------|----------------------------------|
| `global $db` → injected `UserRepository`| global-keyword       | Feathers / DIP                   |
| inline SQL → `Repository::save`        | raw-db-calls         | Fowler PoEAA                     |
| `echo "Bad email"` → `Email` VO throws | echo-html-in-logic   | Jones (separate presentation)    |
| `date()` → `ClockInterface`            | time-in-logic        | PSR-20                           |
| `mail()` → injected `Mailer`           | new-in-logic         | DIP                              |
| `return false` → exception/typed return| error-codes          | Fowler                           |
| added types + strict_types             | no-strict-types      | PSR-12 / PHPStan                 |

## Migration shim (Strangler) — keep the old call site working

```php
function register_user($email, $name) {     // legacy entry, now a thin delegate
    return container()->get(RegisterUser::class)(new Email($email), $name);
}
```

Delete the shim once all call sites use the OOP path.
