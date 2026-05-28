<?php
session_start();

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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

function loadSettings($conn)
{
    $stmt = $conn->query("SELECT klic, hodnota, popis, typ FROM systemova_nastaveni ORDER BY id_nastaveni ASC");
    $settings = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $settings[$row['klic']] = $row;
    }
    return $settings;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        echo json_encode(["success" => true, "settings" => loadSettings($conn)]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
    }
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$settings = $data['settings'] ?? [];

if (!is_array($settings)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Neplatná data nastavení."]);
    exit();
}

$types = [
    "nazev_systemu" => "text",
    "hlavni_email" => "text",
    "vychozi_zacatek_smeny" => "time",
    "vychozi_konec_smeny" => "time",
    "rocni_narok_dovolene" => "number",
    "upozorneni_nova_absence" => "boolean",
    "upozorneni_rozhodnuti_absence" => "boolean",
    "upozorneni_export" => "boolean",
    "upozorneni_chybejici_odchod" => "boolean",
];

try {
    $stmt = $conn->prepare("
        INSERT INTO systemova_nastaveni (klic, hodnota, typ)
        VALUES (:klic, :hodnota, :typ)
        ON DUPLICATE KEY UPDATE hodnota = VALUES(hodnota), typ = VALUES(typ)
    ");

    foreach ($settings as $key => $value) {
        if (!isset($types[$key])) {
            continue;
        }

        if ($key === "rocni_narok_dovolene") {
            $days = (int)$value;
            if ($days < 20 || $days > 40) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Roční nárok dovolené musí být v rozsahu 20 až 40 dní."]);
                exit();
            }
            $value = (string)$days;
        }

        $stmt->execute([
            ":klic" => $key,
            ":hodnota" => is_bool($value) ? ($value ? "1" : "0") : (string)$value,
            ":typ" => $types[$key],
        ]);
    }

    echo json_encode([
        "success" => true,
        "message" => "Nastavení bylo uloženo.",
        "settings" => loadSettings($conn),
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
