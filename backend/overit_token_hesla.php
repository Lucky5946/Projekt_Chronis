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

$token = trim($_GET['token'] ?? '');
if ($token === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Chybí token pro nastavení hesla."]);
    exit();
}

try {
    $stmt = $conn->prepare("
        SELECT z.jmeno, z.prijmeni, z.email, t.platnost_do
        FROM tokeny_hesel t
        JOIN zamestnanci z ON t.id_zamestnanec = z.id_zamestnanec
        WHERE t.token_hash = :tokenHash
            AND t.pouzito = 0
            AND t.platnost_do > NOW()
        LIMIT 1
    ");
    $stmt->execute([":tokenHash" => hash('sha256', $token)]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Odkaz je neplatný nebo už vypršel."]);
        exit();
    }

    echo json_encode([
        "success" => true,
        "user" => [
            "name" => trim($row['jmeno'] . " " . $row['prijmeni']),
            "email" => $row['email'],
        ],
        "expiresAt" => $row['platnost_do'],
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
