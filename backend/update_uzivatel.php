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
require_once "user_photo_helpers.php";

if (!isset($_SESSION['user']) || (!current_user_is_admin() && !current_user_is_manager())) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Přístup odepřen."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$id = (int)($data['id_zamestnanec'] ?? 0);
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

if ($id <= 0 || $jmeno === "" || $prijmeni === "" || $email === "" || $telefon === "" || $cip === "" || $mzda <= 0 || $idPozice <= 0 || $idOddeleni <= 0 || $idVychoziSmena <= 0 || $prihlasovaciJmeno === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Vyplňte všechna povinná pole."]);
    exit();
}

try {
    if (!current_user_is_admin()) {
        if ($idPozice === 1) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Vedoucí nemůže upravovat uživatele na administrátora."]);
            exit();
        }

        if (!department_belongs_to_manager_company($conn, $idOddeleni)) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Oddělení nepatří do vaší firmy."]);
            exit();
        }

        $scopeStmt = $conn->prepare("
            SELECT z.id_pozice
            FROM zamestnanci z
            LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
            WHERE z.id_zamestnanec = :id AND o.id_firma = :companyId
            LIMIT 1
        ");
        $scopeStmt->execute([
            ":id" => $id,
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
            echo json_encode(["success" => false, "message" => "Vedoucí nemůže upravovat administrátory."]);
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
        WHERE (email = :email OR prihlasovaci_jmeno = :login OR cip = :cip)
            AND id_zamestnanec <> :id
        LIMIT 1
    ");
    $existsStmt->execute([
        ":email" => $email,
        ":login" => $prihlasovaciJmeno,
        ":cip" => $cip,
        ":id" => $id,
    ]);

    if ($existsStmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Email, čip nebo přihlašovací jméno už používá jiný uživatel."]);
        exit();
    }

    $currentPhotoStmt = $conn->prepare("SELECT fotka_cesta FROM zamestnanci WHERE id_zamestnanec = :id LIMIT 1");
    $currentPhotoStmt->execute([":id" => $id]);
    $photoPath = user_photo_save($fotkaData, $currentPhotoStmt->fetchColumn() ?: null);

    $params = [
        ":id" => $id,
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
        ":aktivni" => $aktivni,
    ];

    $passwordSql = "";
    if ($heslo !== "") {
        $passwordSql = ", heslo = :heslo";
        $params[":heslo"] = password_hash($heslo, PASSWORD_DEFAULT);
    }

    $stmt = $conn->prepare("
        UPDATE zamestnanci
        SET
            jmeno = :jmeno,
            prijmeni = :prijmeni,
            email = :email,
            telefon = :telefon,
            fotka_cesta = :fotkaCesta,
            cip = :cip,
            mzda = :mzda,
            datum_nastupu = :datumNastupu,
            id_pozice = :idPozice,
            id_oddeleni = :idOddeleni,
            id_vychozi_smena = :idVychoziSmena,
            prihlasovaci_jmeno = :login,
            aktivni = :aktivni
            $passwordSql
        WHERE id_zamestnanec = :id
    ");
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
        $checkStmt = $conn->prepare("SELECT id_zamestnanec FROM zamestnanci WHERE id_zamestnanec = :id LIMIT 1");
        $checkStmt->execute([":id" => $id]);
        if (!$checkStmt->fetch()) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Uživatel nebyl nalezen."]);
            exit();
        }
    }

    echo json_encode(["success" => true, "message" => "Uživatel byl upraven."]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
