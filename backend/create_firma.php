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

if ($nazev === "" || $ico === "" || $email === "" || $telefon === "" || $ulice === "" || $cisloPopisne === "" || $psc === "" || $obec === "") {
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

    $nextAddressId = (int)$conn->query("SELECT COALESCE(MAX(id_adresa), 0) + 1 FROM adresy")->fetchColumn();
    $nextCompanyId = (int)$conn->query("SELECT COALESCE(MAX(id_firma), 0) + 1 FROM firmy")->fetchColumn();

    $addressStmt = $conn->prepare("
        INSERT INTO adresy (id_adresa, ulice, cislo_popisne, id_psc)
        VALUES (:idAdresa, :ulice, :cisloPopisne, :psc)
    ");
    $addressStmt->execute([
        ":idAdresa" => $nextAddressId,
        ":ulice" => $ulice,
        ":cisloPopisne" => $cisloPopisne,
        ":psc" => $psc,
    ]);

    $companyStmt = $conn->prepare("
        INSERT INTO firmy (id_firma, nazev, ico, email, telefon, id_adresa, logo_cesta, dovolena_dni)
        VALUES (:idFirma, :nazev, :ico, :email, :telefon, :idAdresa, :logoCesta, :dovolenaDni)
    ");
    $companyStmt->execute([
        ":idFirma" => $nextCompanyId,
        ":nazev" => $nazev,
        ":ico" => $ico,
        ":email" => $email,
        ":telefon" => $telefon,
        ":idAdresa" => $nextAddressId,
        ":logoCesta" => $logoCesta !== "" ? $logoCesta : null,
        ":dovolenaDni" => $dovolenaDni,
    ]);

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Firma byla vytvořena.",
        "id_firma" => $nextCompanyId,
    ]);
} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
