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

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Uživatel není přihlášen."]);
    exit();
}

$year = (int)($_GET['year'] ?? date("Y"));
$month = (int)($_GET['month'] ?? date("n"));

if ($year < 2000 || $year > 2100 || $month < 1 || $month > 12) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Neplatné období."]);
    exit();
}

try {
    $userId = (int)$_SESSION['user']['id'];
    $from = sprintf("%04d-%02d-01", $year, $month);
    $to = date("Y-m-t", strtotime($from));

    $stmt = $conn->prepare("
        SELECT
            id_dochazka_den,
            datum,
            TIME_FORMAT(prichod, '%H:%i') AS prichod,
            TIME_FORMAT(odchod, '%H:%i') AS odchod,
            pauza_minut,
            mimo_pracoviste_minut,
            CASE
                WHEN odpracovano_minut IS NOT NULL THEN odpracovano_minut
                WHEN datum = CURDATE() AND prichod IS NOT NULL AND odchod IS NULL
                    THEN GREATEST(TIMESTAMPDIFF(MINUTE, TIMESTAMP(datum, prichod), NOW()) - pauza_minut - mimo_pracoviste_minut, 0)
                ELSE NULL
            END AS odpracovano_minut,
            stav,
            poznamka
        FROM dochazka_dny
        WHERE id_zamestnanec = :userId
            AND datum BETWEEN :fromDate AND :toDate
        ORDER BY datum ASC
    ");
    $stmt->execute([
        ":userId" => $userId,
        ":fromDate" => $from,
        ":toDate" => $to,
    ]);

    $records = [];
    $totalMinutes = 0;
    $lateCount = 0;
    $absenceCount = 0;
    $openCount = 0;

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $workedMinutes = $row['odpracovano_minut'] !== null ? (int)$row['odpracovano_minut'] : null;
        $status = $row['stav'];

        if ($workedMinutes !== null) {
            $totalMinutes += $workedMinutes;
        }

        if ($status === "pozdni_prichod") {
            $lateCount++;
        }

        if ($status === "absence") {
            $absenceCount++;
        }

        if ($status === "neuzavreno") {
            $openCount++;
        }

        $records[] = [
            "id" => (int)$row['id_dochazka_den'],
            "date" => $row['datum'],
            "arrival" => $row['prichod'],
            "leave" => $row['odchod'],
            "pauseMinutes" => (int)$row['pauza_minut'],
            "outsideMinutes" => (int)$row['mimo_pracoviste_minut'],
            "workedMinutes" => $workedMinutes,
            "status" => $status,
            "note" => $row['poznamka'],
        ];
    }

    echo json_encode([
        "success" => true,
        "period" => [
            "year" => $year,
            "month" => $month,
            "from" => $from,
            "to" => $to,
        ],
        "summary" => [
            "totalMinutes" => $totalMinutes,
            "lateCount" => $lateCount,
            "absenceCount" => $absenceCount,
            "openCount" => $openCount,
            "recordCount" => count($records),
        ],
        "records" => $records,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
