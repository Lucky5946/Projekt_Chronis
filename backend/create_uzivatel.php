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
require_once "auth_helpers.php";
require_once "password_reset_helpers.php";
require_once "user_photo_helpers.php";

if (!isset($_SESSION['user']) || (!current_user_is_admin() && !current_user_is_manager())) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Přístup odepřen."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$jmeno = trim($data['jmeno'] ?? "");
$prijmeni = trim($data['prijmeni'] ?? "");
$email = trim($data['email'] ?? "");
$telefon = trim($data['telefon'] ?? "");
$fotkaData = trim($data['fotka_data'] ?? "");
$cip = trim($data['cip'] ?? "");
$mzda = (float)($data['mzda'] ?? 0);
$datumNastupu = trim($data['datum_nastupu'] ?? "");
$idPozice = (int)($data['id_pozice'] ?? 0);
$idOddeleni = (int)($data['id_oddeleni'] ?? 0);
$idVychoziSmena = (int)($data['id_vychozi_smena'] ?? 0);
$prihlasovaciJmeno = trim($data['prihlasovaci_jmeno'] ?? "");
$heslo = (string)($data['heslo'] ?? "");
$aktivni = !empty($data['aktivni']) ? 1 : 0;

if ($jmeno === "" || $prijmeni === "" || $email === "" || $telefon === "" || $cip === "" || $mzda <= 0 || $idPozice <= 0 || $idOddeleni <= 0 || $idVychoziSmena <= 0 || $prihlasovaciJmeno === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Vyplňte všechna povinná pole."]);
    exit();
}

try {
    if (!current_user_is_admin()) {
        if ($idPozice === 1) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Vedoucí nemůže vytvářet administrátory."]);
            exit();
        }

        if (!department_belongs_to_manager_company($conn, $idOddeleni)) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Oddělení nepatří do vaší firmy."]);
            exit();
        }
    }

    $shiftStmt = $conn->prepare("SELECT id_smena FROM smeny WHERE id_smena = :shiftId AND aktivni = 1 LIMIT 1");
    $shiftStmt->execute([":shiftId" => $idVychoziSmena]);
    if (!$shiftStmt->fetch()) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Vybraná směna neexistuje nebo není aktivní."]);
        exit();
    }

    $existsStmt = $conn->prepare("
        SELECT id_zamestnanec
        FROM zamestnanci
        WHERE email = :email OR prihlasovaci_jmeno = :login OR cip = :cip
        LIMIT 1
    ");
    $existsStmt->execute([
        ":email" => $email,
        ":login" => $prihlasovaciJmeno,
        ":cip" => $cip,
    ]);

    if ($existsStmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Email, čip nebo přihlašovací jméno už existuje."]);
        exit();
    }

    $nextId = (int)$conn->query("SELECT COALESCE(MAX(id_zamestnanec), 0) + 1 FROM zamestnanci")->fetchColumn();
    $initialPassword = $heslo !== "" ? $heslo : bin2hex(random_bytes(16));
    $passwordHash = password_hash($initialPassword, PASSWORD_DEFAULT);
    $photoPath = user_photo_save($fotkaData);

    $stmt = $conn->prepare("
        INSERT INTO zamestnanci (
            id_zamestnanec,
            jmeno,
            prijmeni,
            email,
            telefon,
            fotka_cesta,
            cip,
            mzda,
            datum_nastupu,
            id_pozice,
            id_oddeleni,
            id_vychozi_smena,
            prihlasovaci_jmeno,
            heslo,
            aktivni
        )
        VALUES (
            :id,
            :jmeno,
            :prijmeni,
            :email,
            :telefon,
            :fotkaCesta,
            :cip,
            :mzda,
            :datumNastupu,
            :idPozice,
            :idOddeleni,
            :idVychoziSmena,
            :login,
            :heslo,
            :aktivni
        )
    ");
    $stmt->execute([
        ":id" => $nextId,
        ":jmeno" => $jmeno,
        ":prijmeni" => $prijmeni,
        ":email" => $email,
        ":telefon" => $telefon,
        ":fotkaCesta" => $photoPath,
        ":cip" => $cip,
        ":mzda" => $mzda,
        ":datumNastupu" => $datumNastupu !== "" ? $datumNastupu : null,
        ":idPozice" => $idPozice,
        ":idOddeleni" => $idOddeleni,
        ":idVychoziSmena" => $idVychoziSmena,
        ":login" => $prihlasovaciJmeno,
        ":heslo" => $passwordHash,
        ":aktivni" => $aktivni,
    ]);

    $reset = password_reset_create($conn, $nextId);
    $emailResult = password_reset_send_email(
        $email,
        trim($jmeno . " " . $prijmeni),
        $reset['url']
    );

    echo json_encode([
        "success" => true,
        "message" => $emailResult['sent']
            ? "Uživatel byl vytvořen a email s nastavením hesla byl odeslán."
            : "Uživatel byl vytvořen. Email se nepodařilo odeslat, použijte testovací odkaz.",
        "id_zamestnanec" => $nextId,
        "passwordSetup" => [
            "sent" => $emailResult['sent'],
            "message" => $emailResult['message'],
            "url" => $reset['url'],
            "expiresAt" => $reset['expiresAt'],
        ],
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
