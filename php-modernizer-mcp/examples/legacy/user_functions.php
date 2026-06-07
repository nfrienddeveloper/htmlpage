<?php
// LEGACY FIXTURE (intentionally bad) — used to validate the expert's smell
// detection. Do NOT "fix" this file; it exists to be detected. See examples/.

require_once 'db.php';        // include of logic instead of autoloading
session_start();              // session bootstrap inside a logic file

function register_user($email, $name) {
    global $db;                                            // global-keyword
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "Bad email";                                 // echo-html-in-logic
        return false;                                     // error-codes
    }
    $created = date('Y-m-d H:i:s');                        // time-in-logic
    $logger = new FileLogger('/var/log/app.log');         // new-in-logic
    // sql-injection-risk + raw-db-calls:
    $db->query("INSERT INTO users (email, name, created) VALUES ('$email', '$name', '$created')");
    @mail($email, "Welcome", "Hi $name");                 // error-suppression
    header('Location: /welcome');                         // header-in-logic
    var_dump($_SESSION);                                  // debug-output + superglobal
    exit;                                                  // exit-die-in-logic
}

function user_role($type) {
    switch ($type) {                                      // switch-on-type
        case 'admin':  return 'all';
        case 'editor': return 'write';
        default:       return 'read';
    }
}

function config_get($key) {
    return $GLOBALS['config'][$key];                      // globals-array
}
