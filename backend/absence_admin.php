<?php
session_start();

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "connection.php";
require_once "auth_helpers.php";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_admin_or_manager();

$statusMap = [
    "cekajici" => "pending",
    "schvaleno" => "approved",
    "zamitnuto" => "rejected",
];

try {
    $isAdmin = current_user_is_admin();
    $companyId = current_user_company_id($conn);
    $scopeSql = $isAdmin ? "" : "WHERE o.id_firma = :companyId";
    $scopeParams = $isAdmin ? [] : [":companyId" => $companyId ?: 0];

    $stmt = $conn->prepare("
        SELECT
            a.id_absence,
            a.datum_od,
            a.datum_do,
            a.cas_od,
            a.cas_do,
            a.misto,
            a.poznamka,
            a.stav,
            a.datum_podani,
            a.datum_schvaleni,
            a.poznamka_schvaleni,
            t.nazev AS typ,
            z.jmeno,
            z.prijmeni,
            o.nazev AS oddeleni,
            f.nazev AS firma,
            CONCAT(s.jmeno, ' ', s.prijmeni) AS schvalil
        FROM zadosti_absence a
        JOIN zamestnanci z ON a.id_zamestnanec = z.id_zamestnanec
        JOIN typy t ON a.id_typ = t.id_typ
        LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
        LEFT JOIN firmy f ON o.id_firma = f.id_firma
        LEFT JOIN zamestnanci s ON a.id_schvalil = s.id_zamestnanec
        $scopeSql
        ORDER BY a.datum_podani DESC, a.id_absence DESC
    ");
    $stmt->execute($scopeParams);

    $requests = array_map(function ($row) use ($statusMap) {
        $from = new DateTime($row['datum_od']);
        $to = new DateTime($row['datum_do']);
        $days = (int)$from->diff($to)->format('%a') + 1;
        $time = null;

        if (!empty($row['cas_od']) && !empty($row['cas_do'])) {
            $time = substr($row['cas_od'], 0, 5) . " - " . substr($row['cas_do'], 0, 5);
        }

        return [
            "id" => (int)$row['id_absence'],
            "employee" => trim($row['jmeno'] . " " . $row['prijmeni']),
            "department" => $row['oddeleni'] ?: "Neuvedeno",
            "company" => $row['firma'] ?: "Neuvedeno",
            "type" => $row['typ'],
            "from" => $row['datum_od'],
            "to" => $row['datum_do'],
            "time" => $time,
            "place" => $row['misto'],
            "days" => $days,
            "submitted" => substr($row['datum_podani'], 0, 10),
            "reason" => $row['poznamka'],
            "status" => $statusMap[$row['stav']] ?? "pending",
            "approvedBy" => $row['schvalil'],
            "approvedAt" => $row['datum_schvaleni'],
            "approvalNote" => $row['poznamka_schvaleni'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    echo json_encode(["success" => true, "requests" => $requests, "scope" => $isAdmin ? "all" : "company"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
