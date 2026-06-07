<?php
// ============================================================================
//  BEFORE — legacy procedural PHP (the kind of code we modernize).
//  Globals, inline SQL, echo from logic, date()/mail() hidden deps, return
//  false for errors, everything tangled in one function. Kept for comparison;
//  the modernized version lives in ../src and is covered by tests in ../tests.
// ============================================================================

require_once 'db.php';   // sets up global $db

function register_user($email, $name) {
    global $db;

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "Bad email";                 // presentation in the domain
        return false;                     // error-by-sentinel
    }

    // duplicate check + insert: inline SQL, injection-prone, schema leaks out
    $existing = $db->query("SELECT id FROM users WHERE email = '$email'");
    if ($existing && $existing->num_rows > 0) {
        echo "Already registered";
        return false;
    }

    $created = date('Y-m-d H:i:s');       // untestable time dependency
    $db->query("INSERT INTO users (email, name, created) VALUES ('$email', '$name', '$created')");

    mail($email, "Welcome", "Hi $name"); // untestable side effect

    return true;
}
