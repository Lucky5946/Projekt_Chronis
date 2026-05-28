<?php
session_start();

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "connection.php";
require_once "auth_helpers.php";

if (!isset($_SESSION['user']) || (!current_user_is_admin() && !current_user_is_manager())) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Přístup odepřen."]);
    exit();
}

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Neplatné ID uživatele."]);
    exit();
}

$userId = (int)$_GET['id'];

if ($userId === (int)$_SESSION['user']['id']) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Nemůžete smazat vlastní účet."]);
    exit();
}

try {
    if (!current_user_is_admin()) {
        $scopeStmt = $conn->prepare("
            SELECT z.id_pozice
            FROM zamestnanci z
            LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
            WHERE z.id_zamestnanec = :id AND o.id_firma = :companyId
            LIMIT 1
        ");
        $scopeStmt->execute([
            ":id" => $userId,
            ":companyId" => current_user_company_id($conn) ?: 0,
        ]);
        $targetPosition = $scopeStmt->fetchColumn();

        if ($targetPosition === false) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "K tomuto uživateli nemáte přístup."]);
            exit();
        }

        if ((int)$targetPosition === 1) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Vedoucí nemůže mazat administrátory."]);
            exit();
        }
    }

    $stmt = $conn->prepare("DELETE FROM zamestnanci WHERE id_zamestnanec = :id");
    $stmt->execute([":id" => $userId]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Uživatel nebyl nalezen."]);
        exit();
    }

    echo json_encode(["success" => true, "message" => "Uživatel byl smazán."]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
