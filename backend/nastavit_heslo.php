<?php
session_start();

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "connection.php";

$data = json_decode(file_get_contents("php://input"), true);
$token = trim($data['token'] ?? '');
$password = (string)($data['heslo'] ?? '');

if ($token === '' || strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Heslo musí mít alespoň 8 znaků."]);
    exit();
}

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT id_token, id_zamestnanec
        FROM tokeny_hesel
        WHERE token_hash = :tokenHash
            AND pouzito = 0
            AND platnost_do > NOW()
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute([":tokenHash" => hash('sha256', $token)]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        throw new RuntimeException("Odkaz je neplatný nebo už vypršel.");
    }

    $passwordStmt = $conn->prepare("
        UPDATE zamestnanci
        SET heslo = :passwordHash
        WHERE id_zamestnanec = :employeeId
    ");
    $passwordStmt->execute([
        ":passwordHash" => password_hash($password, PASSWORD_DEFAULT),
        ":employeeId" => (int)$row['id_zamestnanec'],
    ]);

    $tokenStmt = $conn->prepare("
        UPDATE tokeny_hesel
        SET pouzito = 1, pouzito_dne = NOW()
        WHERE id_token = :tokenId
    ");
    $tokenStmt->execute([":tokenId" => (int)$row['id_token']]);

    $conn->commit();

    echo json_encode(["success" => true, "message" => "Heslo bylo nastaveno."]);
} catch (RuntimeException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
