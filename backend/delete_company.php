<?php
session_start();
require_once "connection.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ověření, že uživatel je admin (podle session)
if (!isset($_SESSION['user']) || $_SESSION['user']['isAdmin'] !== true) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Přístup odepřen"]);
    exit();
}

// Získání ID firmy z query parametru
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Neplatné ID firmy"]);
    exit();
}

$companyId = (int)$_GET['id'];

try {
    // Nejprve zjistíme id_adresa firmy
    $stmt = $conn->prepare("SELECT id_adresa FROM firmy WHERE id_firma = :id LIMIT 1");
    $stmt->bindParam(":id", $companyId, PDO::PARAM_INT);
    $stmt->execute();
    $firma = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($firma && $firma['id_adresa']) {
        $idAdresy = $firma['id_adresa'];

        // Smažeme adresu podle id_adresa
        $stmt = $conn->prepare("DELETE FROM adresy WHERE id_adresa = :id_adresa");
        $stmt->bindParam(":id_adresa", $idAdresy, PDO::PARAM_INT);
        $stmt->execute();
    }

    // Nakonec smažeme firmu
    $stmt = $conn->prepare("DELETE FROM firmy WHERE id_firma = :id");
    $stmt->bindParam(":id", $companyId, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode(["success" => true, "message" => "Firma a její adresa byly smazány"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}

