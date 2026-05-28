<?php

require __DIR__ . "/src/Support/api.php";
require __DIR__ . "/shift_helpers.php";

$conn = api_bootstrap(["GET"]);
$userId = api_user_id();

function dashboard_attendance_state($day, $lastEvent)
{
    if (!$day || empty($day['prichod'])) {
        return ["state" => "none", "label" => "Mimo práci"];
    }

    if (!empty($day['odchod'])) {
        return ["state" => "odchod", "label" => "Den ukončen"];
    }

    if ($lastEvent && $lastEvent['typ'] === "zacatek_pauzy") {
        return ["state" => "pauza", "label" => "Pauza"];
    }

    if ($lastEvent && $lastEvent['typ'] === "odchod_mimo_pracoviste") {
        return ["state" => "mimo", "label" => "Mimo pracoviště"];
    }

    return ["state" => "prichod", "label" => "V práci"];
}

try {
    $shift = get_shift_for_employee($conn, $userId, date('Y-m-d'));

    $dayStmt = $conn->prepare("
        SELECT *
        FROM dochazka_dny
        WHERE id_zamestnanec = :userId AND datum = CURDATE()
        LIMIT 1
    ");
    $dayStmt->execute([":userId" => $userId]);
    $today = $dayStmt->fetch(PDO::FETCH_ASSOC);

    $lastEventStmt = $conn->prepare("
        SELECT typ
        FROM dochazka_udalosti
        WHERE id_zamestnanec = :userId AND DATE(cas_udalosti) = CURDATE()
        ORDER BY cas_udalosti DESC, id_udalost DESC
        LIMIT 1
    ");
    $lastEventStmt->execute([":userId" => $userId]);
    $lastEvent = $lastEventStmt->fetch(PDO::FETCH_ASSOC);
    $state = dashboard_attendance_state($today, $lastEvent);

    $todayMinutes = 0;
    if ($today) {
        if (!empty($today['odchod']) || (int)$today['odpracovano_minut'] > 0) {
            $todayMinutes = (int)$today['odpracovano_minut'];
        } elseif (!empty($today['prichod'])) {
            $calcStmt = $conn->prepare("
                SELECT GREATEST(TIMESTAMPDIFF(MINUTE, TIMESTAMP(datum, prichod), NOW()) - pauza_minut - mimo_pracoviste_minut, 0)
                FROM dochazka_dny
                WHERE id_dochazka_den = :dayId
            ");
            $calcStmt->execute([":dayId" => (int)$today['id_dochazka_den']]);
            $todayMinutes = (int)$calcStmt->fetchColumn();
        }
    }

    $monthStmt = $conn->prepare("
        SELECT COALESCE(SUM(odpracovano_minut), 0)
        FROM dochazka_dny
        WHERE id_zamestnanec = :userId
            AND datum BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND LAST_DAY(CURDATE())
    ");
    $monthStmt->execute([":userId" => $userId]);
    $monthMinutes = (int)$monthStmt->fetchColumn();

    $requestStmt = $conn->prepare("
        SELECT
            COALESCE(SUM(CASE WHEN stav = 'cekajici' THEN 1 ELSE 0 END), 0) AS pending,
            COUNT(*) AS total
        FROM zadosti_absence
        WHERE id_zamestnanec = :userId
    ");
    $requestStmt->execute([":userId" => $userId]);
    $requests = $requestStmt->fetch(PDO::FETCH_ASSOC);

    api_response([
        "success" => true,
        "attendance" => [
            "state" => $state['state'],
            "label" => $state['label'],
            "todayMinutes" => $todayMinutes,
            "monthMinutes" => $monthMinutes,
            "arrival" => $today && $today['prichod'] ? substr($today['prichod'], 0, 5) : null,
            "leave" => $today && $today['odchod'] ? substr($today['odchod'], 0, 5) : null,
            "pauseMinutes" => $today ? (int)$today['pauza_minut'] : 0,
            "outsideMinutes" => $today ? (int)$today['mimo_pracoviste_minut'] : 0,
        ],
        "shift" => shift_payload($shift),
        "requests" => [
            "pending" => (int)$requests['pending'],
            "total" => (int)$requests['total'],
        ],
    ]);
} catch (PDOException $e) {
    api_response(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()], 500);
}
