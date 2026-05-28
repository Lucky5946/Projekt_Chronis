<?php

require __DIR__ . "/../connection.php";

function column_exists(PDO $conn, string $table, string $column): bool
{
    $stmt = $conn->prepare("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = :tableName
            AND COLUMN_NAME = :columnName
    ");
    $stmt->execute([
        ":tableName" => $table,
        ":columnName" => $column,
    ]);

    return (int)$stmt->fetchColumn() > 0;
}

function foreign_key_exists(PDO $conn, string $constraint): bool
{
    $stmt = $conn->prepare("
        SELECT COUNT(*)
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
            AND CONSTRAINT_NAME = :constraintName
            AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    ");
    $stmt->execute([":constraintName" => $constraint]);

    return (int)$stmt->fetchColumn() > 0;
}

$conn->exec("
    CREATE TABLE IF NOT EXISTS smeny (
        id_smena INT NOT NULL AUTO_INCREMENT,
        nazev VARCHAR(80) NOT NULL,
        cas_od TIME NOT NULL,
        cas_do TIME NOT NULL,
        tolerance_minut INT NOT NULL DEFAULT 10,
        uvazek_minut INT NOT NULL DEFAULT 480,
        aktivni TINYINT(1) NOT NULL DEFAULT 1,
        vytvoreno DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_smena),
        UNIQUE KEY smeny_nazev_uq (nazev)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

$seedStmt = $conn->prepare("
    INSERT IGNORE INTO smeny (nazev, cas_od, cas_do, tolerance_minut, uvazek_minut)
    VALUES (:nazev, :casOd, :casDo, :tolerance, :uvazek)
");

foreach ([
    ["Ranní směna", "06:00:00", "14:00:00", 10, 480],
    ["Odpolední směna", "14:00:00", "22:00:00", 10, 480],
    ["Noční směna", "22:00:00", "06:00:00", 10, 480],
    ["Zkrácený úvazek", "08:00:00", "12:00:00", 5, 240],
] as $shift) {
    $seedStmt->execute([
        ":nazev" => $shift[0],
        ":casOd" => $shift[1],
        ":casDo" => $shift[2],
        ":tolerance" => $shift[3],
        ":uvazek" => $shift[4],
    ]);
}

if (!column_exists($conn, "zamestnanci", "id_vychozi_smena")) {
    $conn->exec("ALTER TABLE zamestnanci ADD COLUMN id_vychozi_smena INT NULL AFTER id_oddeleni");
}

$defaultShiftId = (int)$conn->query("SELECT id_smena FROM smeny WHERE nazev = 'Ranní směna' LIMIT 1")->fetchColumn();
if ($defaultShiftId > 0) {
    $stmt = $conn->prepare("UPDATE zamestnanci SET id_vychozi_smena = :shiftId WHERE id_vychozi_smena IS NULL");
    $stmt->execute([":shiftId" => $defaultShiftId]);
}

if (!foreign_key_exists($conn, "zamestnanci_vychozi_smena_fk")) {
    $conn->exec("
        ALTER TABLE zamestnanci
        ADD CONSTRAINT zamestnanci_vychozi_smena_fk
        FOREIGN KEY (id_vychozi_smena) REFERENCES smeny(id_smena)
        ON DELETE SET NULL ON UPDATE CASCADE
    ");
}

$conn->exec("
    CREATE TABLE IF NOT EXISTS plan_smen (
        id_plan INT NOT NULL AUTO_INCREMENT,
        id_zamestnanec INT NOT NULL,
        datum DATE NOT NULL,
        id_smena INT NOT NULL,
        poznamka VARCHAR(255) NULL,
        vytvoreno DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_plan),
        UNIQUE KEY plan_smen_zamestnanec_datum_uq (id_zamestnanec, datum),
        KEY plan_smen_smena_fk (id_smena),
        CONSTRAINT plan_smen_zamestnanec_fk FOREIGN KEY (id_zamestnanec)
            REFERENCES zamestnanci(id_zamestnanec) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT plan_smen_smena_fk FOREIGN KEY (id_smena)
            REFERENCES smeny(id_smena) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

echo "OK";
