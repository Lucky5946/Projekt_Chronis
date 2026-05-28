<?php
session_start();

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "connection.php";
require_once "auth_helpers.php";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_admin_or_manager();

$data = json_decode(file_get_contents("php://input"), true);
$idAbsence = (int)($data['idAbsence'] ?? $data['id'] ?? 0);
$status = $data['status'] ?? "";
$note = trim($data['note'] ?? "");

$statusMap = [
    "approved" => "schvaleno",
    "rejected" => "zamitnuto",
];

if ($idAbsence <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Neplatné ID žádosti."]);
    exit();
}

if (!isset($statusMap[$status])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Neplatný stav žádosti."]);
    exit();
}

try {
    $isAdmin = current_user_is_admin();
    $companyId = current_user_company_id($conn);

    $stmt = $conn->prepare("
        UPDATE zadosti_absence a
        JOIN zamestnanci z ON a.id_zamestnanec = z.id_zamestnanec
        LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
        SET
            a.stav = :stav,
            a.id_schvalil = :idSchvalil,
            a.datum_schvaleni = NOW(),
            a.poznamka_schvaleni = :poznamka
        WHERE a.id_absence = :idAbsence
            AND (:isAdmin = 1 OR o.id_firma = :companyId)
    ");

    $stmt->execute([
        ":stav" => $statusMap[$status],
        ":idSchvalil" => current_user_id(),
        ":poznamka" => $note !== "" ? $note : null,
        ":idAbsence" => $idAbsence,
        ":isAdmin" => $isAdmin ? 1 : 0,
        ":companyId" => $companyId ?: 0,
    ]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Žádost nebyla nalezena nebo k ní nemáte přístup."]);
        exit();
    }

    echo json_encode(["success" => true, "message" => "Stav žádosti byl aktualizován."]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
