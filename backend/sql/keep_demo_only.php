<?php

require __DIR__ . "/../connection.php";

function table_exists(PDO $conn, string $table): bool
{
    $stmt = $conn->prepare("
        SELECT COUNT(*)
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = :tableName
    ");
    $stmt->execute([":tableName" => $table]);

    return (int)$stmt->fetchColumn() > 0;
}

function exec_if_table(PDO $conn, string $table, string $sql): void
{
    if (table_exists($conn, $table)) {
        $conn->exec($sql);
    }
}

try {
    $conn->beginTransaction();

    $demoEmployees = "101,102,103,104,105,106,107,108,109";
    $demoDepartments = "101,102,103,104,105,106,107";
    $demoCompanies = "101,102,103";
    $demoAddresses = "101,102,103";

    exec_if_table($conn, "tokeny_hesel", "DELETE FROM tokeny_hesel WHERE id_zamestnanec NOT IN ($demoEmployees)");
    exec_if_table($conn, "dochazka_udalosti", "DELETE FROM dochazka_udalosti WHERE id_zamestnanec NOT IN ($demoEmployees)");
    exec_if_table($conn, "dochazka_dny", "DELETE FROM dochazka_dny WHERE id_zamestnanec NOT IN ($demoEmployees)");
    exec_if_table($conn, "plan_smen", "DELETE FROM plan_smen WHERE id_zamestnanec NOT IN ($demoEmployees)");
    exec_if_table($conn, "zadosti_absence", "DELETE FROM zadosti_absence WHERE id_zamestnanec NOT IN ($demoEmployees) OR (id_schvalil IS NOT NULL AND id_schvalil NOT IN ($demoEmployees))");
    exec_if_table($conn, "recenze", "DELETE FROM recenze WHERE id_zamestnanec NOT IN ($demoEmployees)");
    exec_if_table($conn, "zpravy", "DELETE FROM zpravy WHERE (id_odesilatel IS NOT NULL AND id_odesilatel NOT IN ($demoEmployees)) OR (id_prijemce IS NOT NULL AND id_prijemce NOT IN ($demoEmployees))");
    exec_if_table($conn, "exporty", "DELETE FROM exporty WHERE id_vytvoril IS NULL OR id_vytvoril NOT IN ($demoEmployees)");

    exec_if_table($conn, "zamestnanci", "DELETE FROM zamestnanci WHERE id_zamestnanec NOT IN ($demoEmployees)");
    exec_if_table($conn, "oddeleni", "DELETE FROM oddeleni WHERE id_oddeleni NOT IN ($demoDepartments)");
    exec_if_table($conn, "firmy", "DELETE FROM firmy WHERE id_firma NOT IN ($demoCompanies)");
    exec_if_table($conn, "adresy", "DELETE FROM adresy WHERE id_adresa NOT IN ($demoAddresses)");
    exec_if_table($conn, "posty", "DELETE FROM posty WHERE id_psc NOT IN ('53002','60200','30100')");

    $conn->commit();

    require __DIR__ . "/demo_data.php";
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
    exit(1);
}
