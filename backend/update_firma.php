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

if (!isset($_SESSION['user']) || $_SESSION['user']['isAdmin'] !== true) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Přístup odepřen."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$idFirma = (int)($data['id_firma'] ?? 0);
$nazev = trim($data['nazev'] ?? "");
$ico = trim($data['ico'] ?? "");
$email = trim($data['email'] ?? "");
$telefon = trim($data['telefon'] ?? "");
$ulice = trim($data['ulice'] ?? "");
$cisloPopisne = trim($data['cislo_popisne'] ?? "");
$psc = preg_replace('/\D/', '', (string)($data['id_psc'] ?? ""));
$obec = trim($data['obec'] ?? "");
$logoCesta = trim($data['logo_cesta'] ?? "");
$dovolenaDni = (int)($data['dovolena_dni'] ?? 25);

if ($idFirma <= 0 || $nazev === "" || $ico === "" || $email === "" || $telefon === "" || $ulice === "" || $cisloPopisne === "" || $psc === "" || $obec === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Vyplňte všechna povinná pole."]);
    exit();
}

if (strlen($psc) !== 5) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "PSČ musí mít 5 číslic."]);
    exit();
}

if ($dovolenaDni < 20 || $dovolenaDni > 40) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Roční nárok dovolené musí být v rozsahu 20 až 40 dní."]);
    exit();
}

try {
    $conn->beginTransaction();

    $postalStmt = $conn->prepare("
        INSERT INTO posty (id_psc, obec)
        VALUES (:psc, :obec)
        ON DUPLICATE KEY UPDATE obec = VALUES(obec)
    ");
    $postalStmt->execute([
        ":psc" => $psc,
        ":obec" => $obec,
    ]);

    $addressStmt = $conn->prepare("
        SELECT id_adresa
        FROM firmy
        WHERE id_firma = :idFirma
        LIMIT 1
    ");
    $addressStmt->execute([":idFirma" => $idFirma]);
    $firma = $addressStmt->fetch(PDO::FETCH_ASSOC);

    if (!$firma) {
        throw new RuntimeException("Firma nebyla nalezena.");
    }

    $idAdresa = (int)$firma['id_adresa'];

    $updateAddress = $conn->prepare("
        UPDATE adresy
        SET ulice = :ulice, cislo_popisne = :cisloPopisne, id_psc = :psc
        WHERE id_adresa = :idAdresa
    ");
    $updateAddress->execute([
        ":ulice" => $ulice,
        ":cisloPopisne" => $cisloPopisne,
        ":psc" => $psc,
        ":idAdresa" => $idAdresa,
    ]);

    $updateCompany = $conn->prepare("
        UPDATE firmy
        SET
            nazev = :nazev,
            ico = :ico,
            email = :email,
            telefon = :telefon,
            logo_cesta = :logoCesta,
            dovolena_dni = :dovolenaDni
        WHERE id_firma = :idFirma
    ");
    $updateCompany->execute([
        ":nazev" => $nazev,
        ":ico" => $ico,
        ":email" => $email,
        ":telefon" => $telefon,
        ":logoCesta" => $logoCesta !== "" ? $logoCesta : null,
        ":dovolenaDni" => $dovolenaDni,
        ":idFirma" => $idFirma,
    ]);

    $conn->commit();

    echo json_encode(["success" => true, "message" => "Firma byla upravena."]);
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
