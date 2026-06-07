# Golden Example: superglobals + echo script → Action-Domain-Responder

Rules: `superglobal-in-logic`, `echo-html-in-logic`, `header-in-logic`,
`mixed-concerns-file`. Authority: Jones (ADR), PSR-7/15. Principles: SRP.

## Before (procedural script: input + logic + output in one file)

```php
<?php
// create_post.php
require 'db.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = $_POST['title'];
    global $db;
    $db->query("INSERT INTO posts (title) VALUES ('$title')");
    header('Location: /posts');
    exit;
}
echo "<form method='post'><input name='title'></form>";
```

Smells: reads `$_POST`/`$_SERVER` in logic, inline SQL, `header()`+`exit` for
flow, HTML echoed from the same file — every concern tangled.

## After (ADR — input at the edge, domain pure, responder owns output)

```php
<?php
declare(strict_types=1);

namespace App\Post;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

final class CreatePostAction
{
    public function __construct(
        private readonly CreatePost $createPost,   // domain
        private readonly Responder $responder,     // presentation
    ) {}

    public function __invoke(Request $request): Response
    {
        $data = (array) $request->getParsedBody();
        $post = $this->createPost->__invoke(new PostTitle($data['title'] ?? ''));
        return $this->responder->created($post);   // sets Location/status
    }
}

final class CreatePost   // domain: framework-free, unit-testable
{
    public function __construct(private readonly PostRepository $posts) {}

    public function __invoke(PostTitle $title): Post
    {
        $post = new Post($title);
        $this->posts->save($post);    // prepared statement inside repo
        return $post;
    }
}
```

`PostTitle` validates input (no echoing errors from logic); the Responder owns
status/headers/redirects; the domain has no idea HTTP exists.

## Mapping
| Change | Rule | Authority |
|---|---|---|
| `$_POST`/`$_SERVER` read in edge, not logic | superglobal-in-logic | PSR-7 / Jones |
| `header()`+`exit` → Responder returns Response | header-in-logic, exit-die-in-logic | PSR-7 / ADR |
| echoed HTML → Responder/template | echo-html-in-logic | Jones |
| one tangled file → A/D/R layers | mixed-concerns-file | Jones / SRP |
| inline SQL → repository | raw-db-calls | Fowler |

## When NOT to apply
For a trivial static page or a one-off script with no logic, full ADR is overkill.
ADR pays off once a request has real input validation, domain logic, and varied
responses.
