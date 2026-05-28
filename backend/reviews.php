<?php

session_start();

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "connection.php";

function review_user_id(): ?int
{
    return isset($_SESSION['user']['id']) ? (int)$_SESSION['user']['id'] : null;
}

function review_is_admin(): bool
{
    return isset($_SESSION['user']['isAdmin']) && $_SESSION['user']['isAdmin'] === true;
}

function review_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit();
}

function review_input(): array
{
    $data = json_decode(file_get_contents("php://input"), true);

    return is_array($data) ? $data : [];
}

function map_review(array $row): array
{
    return [
        "id" => (int)$row["id_recenze"],
        "id_recenze" => (int)$row["id_recenze"],
        "id_zamestnanec" => (int)$row["id_zamestnanec"],
        "name" => trim($row["jmeno"] . " " . $row["prijmeni"]),
        "text" => $row["text_recenze"],
        "hodnoceni" => (int)$row["hodnoceni"],
        "stav" => $row["stav"],
        "vytvoreno" => $row["vytvoreno"],
        "aktualizovano" => $row["aktualizovano"],
        "logo_cesta" => $row["logo_cesta"],
        "nazev" => $row["nazev"],
        "pozice" => $row["pozice"],
    ];
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $userId = review_user_id();
        $isAdmin = review_is_admin();
        $mode = $_GET["mode"] ?? "public";

        if ($mode === "system" && $userId) {
            $where = $isAdmin ? "1 = 1" : "r.id_zamestnanec = :userId";
            $stmt = $conn->prepare("
                SELECT
                    r.id_recenze,
                    r.id_zamestnanec,
                    r.text_recenze,
                    r.hodnoceni,
                    r.stav,
                    r.vytvoreno,
                    r.aktualizovano,
                    z.jmeno,
                    z.prijmeni,
                    f.logo_cesta,
                    f.nazev,
                    p.nazev AS pozice
                FROM recenze r
                JOIN zamestnanci z ON r.id_zamestnanec = z.id_zamestnanec
                LEFT JOIN pozice p ON z.id_pozice = p.id_pozice
                LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
                LEFT JOIN firmy f ON o.id_firma = f.id_firma
                WHERE {$where}
                ORDER BY r.vytvoreno DESC, r.id_recenze DESC
            ");

            if (!$isAdmin) {
                $stmt->bindValue(":userId", $userId, PDO::PARAM_INT);
            }

            $stmt->execute();
            $reviews = array_map("map_review", $stmt->fetchAll(PDO::FETCH_ASSOC));

            review_response([
                "success" => true,
                "reviews" => $reviews,
                "isAdmin" => $isAdmin,
            ]);
        }

        $stmt = $conn->prepare("
            SELECT
                r.id_recenze,
                r.id_zamestnanec,
                r.text_recenze,
                r.hodnoceni,
                r.stav,
                r.vytvoreno,
                r.aktualizovano,
                z.jmeno,
                z.prijmeni,
                f.logo_cesta,
                f.nazev,
                p.nazev AS pozice
            FROM recenze r
            JOIN zamestnanci z ON r.id_zamestnanec = z.id_zamestnanec
            LEFT JOIN pozice p ON z.id_pozice = p.id_pozice
            LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
            LEFT JOIN firmy f ON o.id_firma = f.id_firma
            WHERE r.stav = 'schvaleno'
            ORDER BY r.vytvoreno DESC, r.id_recenze DESC
            LIMIT 12
        ");
        $stmt->execute();

        echo json_encode(array_map("map_review", $stmt->fetchAll(PDO::FETCH_ASSOC)));
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $userId = review_user_id();

        if (!$userId) {
            review_response(["success" => false, "message" => "Uživatel není přihlášen."], 401);
        }

        $data = review_input();
        $text = trim($data["text"] ?? "");
        $rating = (int)($data["hodnoceni"] ?? 5);

        if (strlen($text) < 20) {
            review_response(["success" => false, "message" => "Recenze musí mít alespoň 20 znaků."], 422);
        }

        if ($rating < 1 || $rating > 5) {
            review_response(["success" => false, "message" => "Hodnocení musí být od 1 do 5."], 422);
        }

        $stmt = $conn->prepare("
            INSERT INTO recenze (id_zamestnanec, text_recenze, hodnoceni, stav)
            VALUES (:userId, :text, :rating, 'cekajici')
        ");
        $stmt->execute([
            ":userId" => $userId,
            ":text" => $text,
            ":rating" => $rating,
        ]);

        review_response([
            "success" => true,
            "message" => "Recenze byla odeslána ke schválení.",
        ], 201);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
        if (!review_is_admin()) {
            review_response(["success" => false, "message" => "Přístup odepřen."], 403);
        }

        $data = review_input();
        $reviewId = (int)($data["id_recenze"] ?? 0);
        $status = $data["stav"] ?? "";
        $allowedStatuses = ["cekajici", "schvaleno", "zamitnuto"];

        if ($reviewId <= 0 || !in_array($status, $allowedStatuses, true)) {
            review_response(["success" => false, "message" => "Neplatná data recenze."], 422);
        }

        $stmt = $conn->prepare("
            UPDATE recenze
            SET stav = :status
            WHERE id_recenze = :reviewId
        ");
        $stmt->execute([
            ":status" => $status,
            ":reviewId" => $reviewId,
        ]);

        review_response(["success" => true, "message" => "Stav recenze byl upraven."]);
    }

    review_response(["success" => false, "message" => "Nepovolená metoda."], 405);
} catch (PDOException $e) {
    review_response(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()], 500);
}
