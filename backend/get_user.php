<?php
session_start(); // 🔴 musí být hned úplně první
require_once "connection.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true"); // důležité, aby cookie fungovala přes CORS

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (isset($_SESSION['user']['id'])) {
    try {
        $stmt = $conn->prepare("SELECT id_zamestnanec, jmeno, prijmeni, id_pozice, email, telefon FROM zamestnanci WHERE id_zamestnanec = :id LIMIT 1");
        $stmt->bindParam(":id", $_SESSION['user']['id'], PDO::PARAM_INT);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $user['isAdmin'] = ($user['id_pozice'] == 1);  // nebo jiná hodnota pro admina
            echo json_encode(["success" => true, "user" => $user]);
        } else {
            echo json_encode(["success" => false, "message" => "Uživatel nenalezen v DB"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Uživatel není přihlášen"]);
}
