<?php
session_start();
require_once "connection.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Kontrola, že uživatel je přihlášený
if (!isset($_SESSION['user']) || empty($_SESSION['user']['jmeno'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Nejste přihlášený"]);
    exit();
}

// Načteme data z JSON těla
$data = json_decode(file_get_contents("php://input"), true);

if (
    empty($data['datumOd']) ||
    empty($data['datumDo']) ||
    empty($data['duvod']) ||
    empty($data['idTyp'])
) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Chybí některá povinná pole"]);
    exit();
}

// Použijeme prihlasovaci_jmeno ze session (v login scriptu jsi ho ale neukládal - přidáme ho tam, nebo použijeme jmeno + prijmeni)
// Tady předpokládám, že jsi do session přidal i prihlasovaci_jmeno, pokud ne, dej ho tam v loginu

if (!isset($_SESSION['user']['prihlasovaci_jmeno'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Chybí přihlašovací jméno v session"]);
    exit();
}

$username = $_SESSION['user']['prihlasovaci_jmeno'];

try {
    $stmt = $conn->prepare("SELECT id_zamestnanec FROM zamestnanci WHERE prihlasovaci_jmeno = :username LIMIT 1");
    $stmt->bindParam(":username", $username);
    $stmt->execute();

    $zamestnanec = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$zamestnanec) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Zaměstnanec nebyl nalezen"]);
        exit();
    }

    $idZamestnanec = $_SESSION['user']['id'];

    $stmtInsert = $conn->prepare("INSERT INTO zadosti_absence (datum_od, datum_do, poznamka, id_zamestnanec, id_typ) VALUES (:datumOd, :datumDo, :poznamka, :idZamestnanec, :idTyp)");

    $stmtInsert->bindParam(":datumOd", $data['datumOd']);
    $stmtInsert->bindParam(":datumDo", $data['datumDo']);
    $stmtInsert->bindParam(":poznamka", $data['duvod']);
    $stmtInsert->bindParam(":idZamestnanec", $idZamestnanec, PDO::PARAM_INT);
    $stmtInsert->bindParam(":idTyp", $data['idTyp'], PDO::PARAM_INT);

    $stmtInsert->execute();

    echo json_encode(["success" => true, "message" => "Žádost o absenci byla uložena"]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
