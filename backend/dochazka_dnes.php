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
require_once "shift_helpers.php";

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Uživatel není přihlášen."]);
    exit();
}

function mapAttendanceState($day, $lastEvent)
{
    if (!$day || empty($day['prichod'])) {
        return "none";
    }

    if (!empty($day['odchod'])) {
        return "odchod";
    }

    if ($lastEvent && $lastEvent['typ'] === "zacatek_pauzy") {
        return "pauza";
    }

    if ($lastEvent && $lastEvent['typ'] === "odchod_mimo_pracoviste") {
        return "mimo";
    }

    return "prichod";
}

function formatLastAction($lastEvent)
{
    if (!$lastEvent) {
        return null;
    }

    $labels = [
        "prichod" => "Příchod",
        "odchod" => "Odchod",
        "zacatek_pauzy" => "Zahájena pauza",
        "konec_pauzy" => "Ukončena pauza",
        "odchod_mimo_pracoviste" => "Odchod mimo pracoviště",
        "navrat_na_pracoviste" => "Návrat na pracoviště",
    ];

    return ($labels[$lastEvent['typ']] ?? "Akce") . " v " . substr($lastEvent['cas_udalosti'], 11, 5);
}

try {
    $userId = (int)$_SESSION['user']['id'];

    $dayStmt = $conn->prepare("
        SELECT *
        FROM dochazka_dny
        WHERE id_zamestnanec = :userId
            AND (
                (odchod IS NULL AND prichod IS NOT NULL)
                OR datum = CURDATE()
            )
        ORDER BY
            CASE WHEN odchod IS NULL AND prichod IS NOT NULL THEN 0 ELSE 1 END,
            datum DESC,
            id_dochazka_den DESC
        LIMIT 1
    ");
    $dayStmt->execute([":userId" => $userId]);
    $day = $dayStmt->fetch(PDO::FETCH_ASSOC);

    $eventSql = "
        SELECT typ, cas_udalosti
        FROM dochazka_udalosti
        WHERE id_zamestnanec = :userId
    ";
    $eventParams = [":userId" => $userId];

    if ($day) {
        $eventSql .= " AND id_dochazka_den = :dayId";
        $eventParams[":dayId"] = (int)$day['id_dochazka_den'];
    } else {
        $eventSql .= " AND DATE(cas_udalosti) = CURDATE()";
    }

    $eventSql .= "
        ORDER BY cas_udalosti DESC, id_udalost DESC
        LIMIT 1
    ";
    $eventStmt = $conn->prepare($eventSql);
    $eventStmt->execute($eventParams);
    $lastEvent = $eventStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "state" => mapAttendanceState($day, $lastEvent),
        "lastAction" => formatLastAction($lastEvent),
        "serverTime" => date("H:i"),
        "shift" => shift_payload(get_shift_for_employee($conn, $userId, $day['datum'] ?? date('Y-m-d'))),
        "today" => $day ? [
            "datum" => $day['datum'],
            "prichod" => $day['prichod'] ? substr($day['prichod'], 0, 5) : null,
            "odchod" => $day['odchod'] ? substr($day['odchod'], 0, 5) : null,
            "pauzaMinut" => (int)$day['pauza_minut'],
            "mimoPracovisteMinut" => (int)$day['mimo_pracoviste_minut'],
            "odpracovanoMinut" => $day['odpracovano_minut'] !== null ? (int)$day['odpracovano_minut'] : null,
            "stav" => $day['stav'],
        ] : null,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
