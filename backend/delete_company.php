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

if (!isset($_SESSION['user']) || $_SESSION['user']['isAdmin'] !== true) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Přístup odepřen."]);
    exit();
}

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Neplatné ID firmy."]);
    exit();
}

$companyId = (int)$_GET['id'];

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("SELECT id_adresa FROM firmy WHERE id_firma = :id LIMIT 1");
    $stmt->execute([":id" => $companyId]);
    $firma = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$firma) {
        throw new RuntimeException("Firma nebyla nalezena.");
    }

    $deleteCompany = $conn->prepare("DELETE FROM firmy WHERE id_firma = :id");
    $deleteCompany->execute([":id" => $companyId]);

    if (!empty($firma['id_adresa'])) {
        $deleteAddress = $conn->prepare("DELETE FROM adresy WHERE id_adresa = :idAdresa");
        $deleteAddress->execute([":idAdresa" => (int)$firma['id_adresa']]);
    }

    $conn->commit();

    echo json_encode(["success" => true, "message" => "Firma byla smazána."]);
} catch (RuntimeException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(404);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
