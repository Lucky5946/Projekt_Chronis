<?php
session_start();

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "connection.php";
require_once "auth_helpers.php";

require_admin_or_manager();

try {
    $isAdmin = current_user_is_admin();
    $companyId = current_user_company_id($conn);
    $scopeSql = $isAdmin ? "" : "WHERE o.id_firma = :companyId";
    $scopeParams = $isAdmin ? [] : [":companyId" => $companyId ?: 0];

    $stmt = $conn->prepare("
        SELECT
            z.id_zamestnanec,
            z.jmeno,
            z.prijmeni,
            z.email,
            z.telefon,
            z.fotka_cesta,
            z.cip,
            z.mzda,
            z.datum_nastupu,
            z.aktivni,
            z.posledni_prihlaseni,
            z.prihlasovaci_jmeno,
            z.id_pozice,
            z.id_oddeleni,
            z.id_vychozi_smena,
            p.nazev AS pozice,
            o.nazev AS oddeleni,
            f.nazev AS firma,
            s.nazev AS smena,
            TIME_FORMAT(s.cas_od, '%H:%i') AS smena_od,
            TIME_FORMAT(s.cas_do, '%H:%i') AS smena_do
        FROM zamestnanci z
        LEFT JOIN pozice p ON z.id_pozice = p.id_pozice
        LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
        LEFT JOIN firmy f ON o.id_firma = f.id_firma
        LEFT JOIN smeny s ON z.id_vychozi_smena = s.id_smena
        $scopeSql
        ORDER BY z.prijmeni ASC, z.jmeno ASC
    ");
    $stmt->execute($scopeParams);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $positionsSql = $isAdmin
        ? "SELECT id_pozice, nazev FROM pozice ORDER BY id_pozice ASC"
        : "SELECT id_pozice, nazev FROM pozice WHERE id_pozice <> 1 ORDER BY id_pozice ASC";
    $positions = $conn->query($positionsSql)->fetchAll(PDO::FETCH_ASSOC);

    $deptStmt = $conn->prepare("
        SELECT
            o.id_oddeleni,
            o.nazev,
            f.nazev AS firma
        FROM oddeleni o
        LEFT JOIN firmy f ON o.id_firma = f.id_firma
        " . ($isAdmin ? "" : "WHERE o.id_firma = :companyId") . "
        ORDER BY f.nazev ASC, o.nazev ASC
    ");
    $deptStmt->execute($scopeParams);
    $departments = $deptStmt->fetchAll(PDO::FETCH_ASSOC);

    $shifts = $conn->query("
        SELECT
            id_smena,
            nazev,
            TIME_FORMAT(cas_od, '%H:%i') AS cas_od,
            TIME_FORMAT(cas_do, '%H:%i') AS cas_do,
            tolerance_minut,
            uvazek_minut
        FROM smeny
        WHERE aktivni = 1
        ORDER BY cas_od ASC, nazev ASC
    ")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "users" => $users,
        "positions" => $positions,
        "departments" => $departments,
        "shifts" => $shifts,
        "scope" => $isAdmin ? "all" : "company",
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
