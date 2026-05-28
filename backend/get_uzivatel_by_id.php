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

if (!isset($_GET["id"]) || !is_numeric($_GET["id"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Chybí nebo je neplatné ID uživatele."]);
    exit();
}

try {
    $isAdmin = current_user_is_admin();
    $companyId = current_user_company_id($conn);

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
            z.prihlasovaci_jmeno,
            z.id_pozice,
            z.id_oddeleni,
            z.id_vychozi_smena,
            p.nazev AS pozice,
            o.nazev AS oddeleni,
            s.nazev AS smena,
            TIME_FORMAT(s.cas_od, '%H:%i') AS smena_od,
            TIME_FORMAT(s.cas_do, '%H:%i') AS smena_do
        FROM zamestnanci z
        LEFT JOIN pozice p ON z.id_pozice = p.id_pozice
        LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
        LEFT JOIN smeny s ON z.id_vychozi_smena = s.id_smena
        WHERE z.id_zamestnanec = :id
            AND (:isAdmin = 1 OR o.id_firma = :companyId)
        LIMIT 1
    ");
    $stmt->execute([
        ":id" => (int)$_GET["id"],
        ":isAdmin" => $isAdmin ? 1 : 0,
        ":companyId" => $companyId ?: 0,
    ]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Uživatel nebyl nalezen nebo k němu nemáte přístup."]);
        exit();
    }

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
    $deptStmt->execute($isAdmin ? [] : [":companyId" => $companyId ?: 0]);
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
        "user" => $user,
        "positions" => $positions,
        "departments" => $departments,
        "shifts" => $shifts,
        "scope" => $isAdmin ? "all" : "company",
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
