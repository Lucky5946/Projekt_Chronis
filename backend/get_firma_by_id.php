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

if (!isset($_GET["id"]) || !is_numeric($_GET["id"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Chybí nebo je neplatný parametr id."]);
    exit();
}

try {
    $stmt = $conn->prepare("
        SELECT
            f.id_firma,
            f.nazev,
            f.ico,
            f.email,
            f.telefon,
            f.logo_cesta,
            f.dovolena_dni,
            f.id_adresa,
            a.ulice,
            a.cislo_popisne,
            p.id_psc,
            p.obec
        FROM firmy f
        LEFT JOIN adresy a ON f.id_adresa = a.id_adresa
        LEFT JOIN posty p ON a.id_psc = p.id_psc
        WHERE f.id_firma = :id
        LIMIT 1
    ");
    $stmt->execute([":id" => (int)$_GET["id"]]);
    $firma = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$firma) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Firma nebyla nalezena."]);
        exit();
    }

    echo json_encode(["success" => true, "firma" => $firma]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
