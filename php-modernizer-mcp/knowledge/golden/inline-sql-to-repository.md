# Golden Example: scattered inline SQL → Repository (with prepared statements)

Rules: `raw-db-calls`, `sql-injection-risk`, `global-keyword`. Authority: Fowler
PoEAA (Repository), OWASP (parameterized queries). Principles: SRP, DIP.

## Before (procedural)

```php
<?php
function find_active_users($search) {
    global $mysqli;
    $sql = "SELECT * FROM users WHERE active = 1 AND name LIKE '%$search%'";
    $res = $mysqli->query($sql);            // SQL injection + global + mixed concern
    $rows = [];
    while ($r = $res->fetch_assoc()) { $rows[] = $r; }
    return $rows;
}
```

Smells: `global $mysqli`, string-interpolated SQL (injection), raw rows leaking
the schema into callers.

## After (OOP)

```php
<?php
declare(strict_types=1);

namespace App\User;

interface UserRepository
{
    /** @return list<User> */
    public function findActiveByName(string $search): array;
}

final class PdoUserRepository implements UserRepository
{
    public function __construct(private readonly \PDO $pdo) {}

    /** @return list<User> */
    public function findActiveByName(string $search): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, name, email FROM users WHERE active = 1 AND name LIKE :q'
        );
        $stmt->execute([':q' => '%' . $search . '%']);   // bound, not interpolated

        return array_map(
            static fn (array $row) => User::fromRow($row),
            $stmt->fetchAll(\PDO::FETCH_ASSOC),
        );
    }
}
```

Callers depend on `UserRepository` (an abstraction) and receive `User` objects;
SQL, the connection, and the schema are isolated behind the gateway.

## Mapping
| Change | Rule | Authority |
|---|---|---|
| `global $mysqli` → injected `\PDO` | global-keyword | Feathers / DIP |
| interpolated SQL → prepared statement | sql-injection-risk | OWASP |
| inline query → `Repository` method | raw-db-calls | Fowler PoEAA |
| `array` rows → `User` objects + interface | (encapsulation/DIP) | Fowler / Martin |

## When NOT to apply
Don't introduce a full Repository + Data Mapper + Unit of Work for a tiny app
with a handful of queries — a single Gateway class with prepared statements may
be enough. Add layers as persistence complexity actually grows.
