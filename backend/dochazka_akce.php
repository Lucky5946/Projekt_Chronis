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
require_once "shift_helpers.php";

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Uživatel není přihlášen."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? "";
$allowedActions = [
    "prichod",
    "odchod",
    "zacatek_pauzy",
    "konec_pauzy",
    "odchod_mimo_pracoviste",
    "navrat_na_pracoviste",
];

if (!in_array($action, $allowedActions, true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Neplatná akce docházky."]);
    exit();
}

function getCurrentAttendanceDay(PDO $conn, int $userId, bool $forUpdate = false): ?array
{
    $lock = $forUpdate ? " FOR UPDATE" : "";
    $stmt = $conn->prepare("
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
        LIMIT 1" . $lock
    );
    $stmt->execute([":userId" => $userId]);
    $day = $stmt->fetch(PDO::FETCH_ASSOC);

    return $day ?: null;
}

function getLastAttendanceEvent(PDO $conn, int $userId, ?int $dayId = null): ?array
{
    $sql = "
        SELECT id_udalost, typ, cas_udalosti
        FROM dochazka_udalosti
        WHERE id_zamestnanec = :userId
    ";
    $params = [":userId" => $userId];

    if ($dayId !== null) {
        $sql .= " AND id_dochazka_den = :dayId";
        $params[":dayId"] = $dayId;
    } else {
        $sql .= " AND DATE(cas_udalosti) = CURDATE()";
    }

    $sql .= " ORDER BY cas_udalosti DESC, id_udalost DESC LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    return $event ?: null;
}

function insertAttendanceEvent(PDO $conn, int $userId, int $dayId, string $type): void
{
    $stmt = $conn->prepare("
        INSERT INTO dochazka_udalosti (id_zamestnanec, id_dochazka_den, typ, cas_udalosti, zdroj)
        VALUES (:userId, :dayId, :type, NOW(), 'web')
    ");
    $stmt->execute([
        ":userId" => $userId,
        ":dayId" => $dayId,
        ":type" => $type,
    ]);
}

try {
    $userId = (int)$_SESSION['user']['id'];
    $conn->beginTransaction();

    $day = getCurrentAttendanceDay($conn, $userId, true);
    $dayId = $day ? (int)$day['id_dochazka_den'] : null;
    $lastEvent = getLastAttendanceEvent($conn, $userId, $dayId);

    if ($action === "prichod") {
        if ($day && empty($day['odchod']) && !empty($day['prichod'])) {
            throw new RuntimeException("Příchod už je zaznamenán.");
        }

        if ($day && $day['datum'] === date('Y-m-d') && !empty($day['prichod'])) {
            throw new RuntimeException("Dnešní docházka už je uzavřená.");
        }

        $stmt = $conn->prepare("
            INSERT INTO dochazka_dny (id_zamestnanec, datum, prichod, pauza_minut, stav)
            VALUES (:userId, CURDATE(), CURTIME(), 0, 'neuzavreno')
        ");
        $stmt->execute([":userId" => $userId]);
        $dayId = (int)$conn->lastInsertId();
        insertAttendanceEvent($conn, $userId, $dayId, "prichod");
    }

    if ($action !== "prichod") {
        if (!$day || empty($day['prichod'])) {
            throw new RuntimeException("Nejdřív zaznamenejte příchod.");
        }

        if (!empty($day['odchod'])) {
            throw new RuntimeException("Docházka už je uzavřená.");
        }

        $dayId = (int)$day['id_dochazka_den'];

        if ($action === "zacatek_pauzy") {
            if ($lastEvent && $lastEvent['typ'] === "zacatek_pauzy") {
                throw new RuntimeException("Pauza už probíhá.");
            }

            if ($lastEvent && $lastEvent['typ'] === "odchod_mimo_pracoviste") {
                throw new RuntimeException("Nejdřív se vraťte na pracoviště.");
            }

            insertAttendanceEvent($conn, $userId, $dayId, "zacatek_pauzy");
        }

        if ($action === "konec_pauzy") {
            if (!$lastEvent || $lastEvent['typ'] !== "zacatek_pauzy") {
                throw new RuntimeException("Aktuálně není spuštěná žádná pauza.");
            }

            $pauseStmt = $conn->prepare("
                UPDATE dochazka_dny
                SET pauza_minut = pauza_minut + GREATEST(TIMESTAMPDIFF(MINUTE, :pauseStart, NOW()), 0)
                WHERE id_dochazka_den = :dayId
            ");
            $pauseStmt->execute([
                ":pauseStart" => $lastEvent['cas_udalosti'],
                ":dayId" => $dayId,
            ]);

            insertAttendanceEvent($conn, $userId, $dayId, "konec_pauzy");
        }

        if ($action === "odchod_mimo_pracoviste") {
            if ($lastEvent && $lastEvent['typ'] === "zacatek_pauzy") {
                throw new RuntimeException("Nejdřív ukončete pauzu.");
            }

            if ($lastEvent && $lastEvent['typ'] === "odchod_mimo_pracoviste") {
                throw new RuntimeException("Už jste mimo pracoviště.");
            }

            insertAttendanceEvent($conn, $userId, $dayId, "odchod_mimo_pracoviste");
        }

        if ($action === "navrat_na_pracoviste") {
            if (!$lastEvent || $lastEvent['typ'] !== "odchod_mimo_pracoviste") {
                throw new RuntimeException("Aktuálně nejste mimo pracoviště.");
            }

            $outsideStmt = $conn->prepare("
                UPDATE dochazka_dny
                SET mimo_pracoviste_minut = mimo_pracoviste_minut + GREATEST(TIMESTAMPDIFF(MINUTE, :outsideStart, NOW()), 0)
                WHERE id_dochazka_den = :dayId
            ");
            $outsideStmt->execute([
                ":outsideStart" => $lastEvent['cas_udalosti'],
                ":dayId" => $dayId,
            ]);

            insertAttendanceEvent($conn, $userId, $dayId, "navrat_na_pracoviste");
        }

        if ($action === "odchod") {
            if ($lastEvent && $lastEvent['typ'] === "zacatek_pauzy") {
                throw new RuntimeException("Nejdřív ukončete pauzu.");
            }

            if ($lastEvent && $lastEvent['typ'] === "odchod_mimo_pracoviste") {
                throw new RuntimeException("Nejdřív se vraťte na pracoviště.");
            }

            $shift = get_shift_for_employee($conn, $userId, $day['datum']);
            $lateLimit = shift_late_limit($shift);

            $leaveStmt = $conn->prepare("
                UPDATE dochazka_dny
                SET
                    odchod = CURTIME(),
                    odpracovano_minut = GREATEST(TIMESTAMPDIFF(MINUTE, TIMESTAMP(datum, prichod), NOW()) - pauza_minut - mimo_pracoviste_minut, 0),
                    stav = IF(prichod > :lateLimit, 'pozdni_prichod', 'pritomen')
                WHERE id_dochazka_den = :dayId
            ");
            $leaveStmt->execute([
                ":lateLimit" => $lateLimit,
                ":dayId" => $dayId,
            ]);

            insertAttendanceEvent($conn, $userId, $dayId, "odchod");
        }
    }

    $conn->commit();

    echo json_encode(["success" => true, "message" => "Docházka byla uložena."]);
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
