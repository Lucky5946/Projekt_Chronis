<?php

require __DIR__ . "/../connection.php";

$defaultStmt = $conn->query("
    SELECT hodnota
    FROM systemova_nastaveni
    WHERE klic = 'rocni_narok_dovolene'
    LIMIT 1
");
$defaultVacation = (int)$defaultStmt->fetchColumn();
if ($defaultVacation < 20 || $defaultVacation > 40) {
    $defaultVacation = 25;
}

$existsStmt = $conn->query("
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'firmy'
        AND COLUMN_NAME = 'dovolena_dni'
");

if ((int)$existsStmt->fetchColumn() === 0) {
    $conn->exec("ALTER TABLE firmy ADD COLUMN dovolena_dni int NOT NULL DEFAULT 25 AFTER logo_cesta");
    $stmt = $conn->prepare("UPDATE firmy SET dovolena_dni = :defaultVacation");
    $stmt->execute([":defaultVacation" => $defaultVacation]);
}

$stmt = $conn->prepare("UPDATE firmy SET dovolena_dni = :defaultVacation WHERE dovolena_dni IS NULL OR dovolena_dni = 0");
$stmt->execute([":defaultVacation" => $defaultVacation]);

$distinctValues = (int)$conn->query("SELECT COUNT(DISTINCT dovolena_dni) FROM firmy")->fetchColumn();
$onlyValue = (int)$conn->query("SELECT MIN(dovolena_dni) FROM firmy")->fetchColumn();
if ($distinctValues === 1 && $onlyValue === 25 && $defaultVacation !== 25) {
    $stmt = $conn->prepare("UPDATE firmy SET dovolena_dni = :defaultVacation");
    $stmt->execute([":defaultVacation" => $defaultVacation]);
}

echo "OK";
