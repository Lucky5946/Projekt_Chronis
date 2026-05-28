<?php

require __DIR__ . "/../connection.php";

$existsStmt = $conn->query("
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'zamestnanci'
        AND COLUMN_NAME = 'fotka_cesta'
");

if ((int)$existsStmt->fetchColumn() === 0) {
    $conn->exec("ALTER TABLE zamestnanci ADD COLUMN fotka_cesta VARCHAR(255) NULL AFTER telefon");
}

echo "OK";
