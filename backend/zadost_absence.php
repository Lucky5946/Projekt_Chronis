<?php
session_start();

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "connection.php";
require_once __DIR__ . "/src/Repositories/MessageRepository.php";
require_once __DIR__ . "/src/Services/MessageService.php";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_SESSION['user']) || empty($_SESSION['user']['jmeno'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Nejste přihlášený."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$idTyp = (int)($data['idTyp'] ?? 0);

if (
    empty($data['datumOd']) ||
    empty($data['datumDo']) ||
    empty($data['duvod']) ||
    $idTyp <= 0
) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Chybí některé povinné pole."]);
    exit();
}

if (!isset($_SESSION['user']['prihlasovaci_jmeno'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Chybí přihlašovací jméno v session."]);
    exit();
}

$username = $_SESSION['user']['prihlasovaci_jmeno'];

try {
    $stmtTyp = $conn->prepare("SELECT nazev FROM typy WHERE id_typ = :idTyp LIMIT 1");
    $stmtTyp->bindParam(":idTyp", $idTyp, PDO::PARAM_INT);
    $stmtTyp->execute();
    $typ = $stmtTyp->fetch(PDO::FETCH_ASSOC);

    if (!$typ) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Neplatný typ žádosti."]);
        exit();
    }

    $isPropustka = strtolower($typ['nazev']) === 'propustka';
    $isDovolena = strtolower($typ['nazev']) === 'dovolená' || strtolower($typ['nazev']) === 'dovolena';
    $casOd = $data['casOd'] ?? null;
    $casDo = $data['casDo'] ?? null;
    $misto = trim($data['misto'] ?? "");

    try {
        $datumOd = new DateTime($data['datumOd']);
        $datumDo = new DateTime($data['datumDo']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Datum žádosti má neplatný formát."]);
        exit();
    }

    if ($datumDo < $datumOd) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Datum do nesmí být dříve než datum od."]);
        exit();
    }

    $pocetDni = (int)$datumOd->diff($datumDo)->format('%a') + 1;

    if ($isPropustka) {
        if (empty($casOd) || empty($casDo)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "U propustky vyplňte čas od a čas do."]);
            exit();
        }

        if (!preg_match('/^\d{2}:\d{2}$/', $casOd) || !preg_match('/^\d{2}:\d{2}$/', $casDo)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Čas propustky má neplatný formát."]);
            exit();
        }

        if ($casOd >= $casDo) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Čas návratu musí být později než čas odchodu."]);
            exit();
        }
    } else {
        $casOd = null;
        $casDo = null;
        $misto = "";
    }

    $stmt = $conn->prepare("
        SELECT
            z.id_zamestnanec,
            f.dovolena_dni
        FROM zamestnanci z
        LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
        LEFT JOIN firmy f ON o.id_firma = f.id_firma
        WHERE z.prihlasovaci_jmeno = :username
        LIMIT 1
    ");
    $stmt->bindParam(":username", $username);
    $stmt->execute();

    $zamestnanec = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$zamestnanec) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Zaměstnanec nebyl nalezen."]);
        exit();
    }

    $idZamestnanec = $_SESSION['user']['id'];
    $limitDovolene = (int)($zamestnanec['dovolena_dni'] ?? 25);

    if ($isDovolena) {
        $rokOd = (int)$datumOd->format('Y');
        $rokDo = (int)$datumDo->format('Y');

        if ($rokOd !== $rokDo) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Žádost o dovolenou musí být v rámci jednoho kalendářního roku.",
            ]);
            exit();
        }

        $usedStmt = $conn->prepare("
            SELECT
                COALESCE(SUM(DATEDIFF(a.datum_do, a.datum_od) + 1), 0) AS vycerpano
            FROM zadosti_absence a
            JOIN typy t ON a.id_typ = t.id_typ
            WHERE a.id_zamestnanec = :idZamestnanec
                AND LOWER(t.nazev) IN ('dovolená', 'dovolena')
                AND a.stav IN ('cekajici', 'schvaleno')
                AND YEAR(a.datum_od) = :rok
                AND YEAR(a.datum_do) = :rok
        ");
        $usedStmt->execute([
            ":idZamestnanec" => $idZamestnanec,
            ":rok" => $rokOd,
        ]);

        $vycerpanoDni = (int)$usedStmt->fetchColumn();
        $celkemPoZadosti = $vycerpanoDni + $pocetDni;

        if ($celkemPoZadosti > $limitDovolene) {
            $zbyvaDni = max($limitDovolene - $vycerpanoDni, 0);
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Limit dovolené pro rok {$rokOd} je {$limitDovolene} dní. Už máte využito nebo čeká {$vycerpanoDni} dní, zbývá {$zbyvaDni} dní.",
            ]);
            exit();
        }
    }

    $stmtInsert = $conn->prepare("
        INSERT INTO zadosti_absence
            (datum_od, datum_do, cas_od, cas_do, misto, poznamka, id_zamestnanec, id_typ)
        VALUES
            (:datumOd, :datumDo, :casOd, :casDo, :misto, :poznamka, :idZamestnanec, :idTyp)
    ");

    $stmtInsert->bindParam(":datumOd", $data['datumOd']);
    $stmtInsert->bindParam(":datumDo", $data['datumDo']);
    $stmtInsert->bindParam(":casOd", $casOd);
    $stmtInsert->bindParam(":casDo", $casDo);
    $stmtInsert->bindValue(":misto", $misto !== "" ? $misto : null);
    $stmtInsert->bindParam(":poznamka", $data['duvod']);
    $stmtInsert->bindParam(":idZamestnanec", $idZamestnanec, PDO::PARAM_INT);
    $stmtInsert->bindParam(":idTyp", $idTyp, PDO::PARAM_INT);

    $stmtInsert->execute();

    $employeeName = trim(($_SESSION['user']['jmeno'] ?? "") . " " . ($_SESSION['user']['prijmeni'] ?? ""));
    $requestType = $typ['nazev'];
    $dateRange = $data['datumOd'] . " - " . $data['datumDo'];
    $timeInfo = $isPropustka ? " Čas: {$casOd} - {$casDo}." : "";

    $messageService = new MessageService(new MessageRepository($conn));
    $messageService->notifyAdmins(
        "Nová žádost o absenci",
        "{$employeeName} odeslal/a žádost typu {$requestType} na termín {$dateRange}.{$timeInfo}"
    );

    echo json_encode(["success" => true, "message" => "Žádost o absenci byla uložena."]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
