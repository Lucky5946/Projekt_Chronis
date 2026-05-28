<?php

require __DIR__ . "/../connection.php";

function recenze_column_exists(PDO $conn, string $column): bool
{
    $stmt = $conn->prepare("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'recenze'
            AND COLUMN_NAME = :columnName
    ");
    $stmt->execute([":columnName" => $column]);

    return (int)$stmt->fetchColumn() > 0;
}

$conn->exec("
    CREATE TABLE IF NOT EXISTS recenze (
        id_recenze INT NOT NULL AUTO_INCREMENT,
        id_zamestnanec INT NOT NULL,
        text_recenze TEXT NOT NULL,
        hodnoceni TINYINT NOT NULL DEFAULT 5,
        stav ENUM('cekajici', 'schvaleno', 'zamitnuto') NOT NULL DEFAULT 'cekajici',
        vytvoreno DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        aktualizovano DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id_recenze),
        KEY recenze_zamestnanec_fk (id_zamestnanec),
        CONSTRAINT recenze_zamestnanec_fk FOREIGN KEY (id_zamestnanec)
            REFERENCES zamestnanci(id_zamestnanec) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

if (!recenze_column_exists($conn, "hodnoceni")) {
    $conn->exec("ALTER TABLE recenze ADD COLUMN hodnoceni TINYINT NOT NULL DEFAULT 5 AFTER text_recenze");
}

if (!recenze_column_exists($conn, "stav")) {
    $conn->exec("ALTER TABLE recenze ADD COLUMN stav ENUM('cekajici', 'schvaleno', 'zamitnuto') NOT NULL DEFAULT 'schvaleno' AFTER hodnoceni");
}

if (!recenze_column_exists($conn, "vytvoreno")) {
    $conn->exec("ALTER TABLE recenze ADD COLUMN vytvoreno DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER stav");
}

if (!recenze_column_exists($conn, "aktualizovano")) {
    $conn->exec("ALTER TABLE recenze ADD COLUMN aktualizovano DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER vytvoreno");
}

echo "OK";
