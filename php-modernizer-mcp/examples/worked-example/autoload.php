<?php

declare(strict_types=1);

// Zero-dependency PSR-4 autoloader so the demo and standalone test runner work
// even before `composer install`. In a real project Composer generates this.
spl_autoload_register(static function (string $class): void {
    $prefixes = [
        'Worked\\Tests\\' => __DIR__ . '/tests/',
        'Worked\\' => __DIR__ . '/src/',
    ];

    foreach ($prefixes as $prefix => $baseDir) {
        if (!str_starts_with($class, $prefix)) {
            continue;
        }
        $relative = substr($class, strlen($prefix));
        $file = $baseDir . str_replace('\\', '/', $relative) . '.php';
        if (is_file($file)) {
            require $file;
            return;
        }
    }
});
