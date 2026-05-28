<?php

require __DIR__ . "/../connection.php";

$existsStmt = $conn->query("
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'dochazka_dny'
        AND COLUMN_NAME = 'mimo_pracoviste_minut'
");

if ((int)$existsStmt->fetchColumn() === 0) {
    $conn->exec("ALTER TABLE dochazka_dny ADD COLUMN mimo_pracoviste_minut INT NOT NULL DEFAULT 0 AFTER pauza_minut");
}

echo "OK";
