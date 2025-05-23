<?php
require_once "connection.php";
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true"); // ✅ NUTNÉ PRO SESSION COOKIE

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$prihlasovaci_jmeno = $data["prihlasovaci_jmeno"] ?? "";
$heslo = $data["heslo"] ?? "";

if (empty($prihlasovaci_jmeno) || empty($heslo)) {
    echo json_encode(["success" => false, "message" => "Zadejte přihlašovací jméno a heslo."]);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT * FROM zamestnanci WHERE prihlasovaci_jmeno = :jmeno LIMIT 1");
    $stmt->bindParam(":jmeno", $prihlasovaci_jmeno);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($heslo, $user["heslo"])) {
    // Zjistíme, jestli je uživatel admin
    $isAdmin = ($user["id_pozice"] == 1);  // nastav si správnou hodnotu pro admina

    // Uložení dat uživatele do session
$_SESSION['user'] = [
    "id" => $user["id_zamestnanec"],
    "jmeno" => $user["jmeno"],
    "prijmeni" => $user["prijmeni"],
    "prihlasovaci_jmeno" => $user["prihlasovaci_jmeno"], // přidat
    "pozice" => $user["id_pozice"],
    "isAdmin" => $isAdmin
];

    echo json_encode([
        "success" => true,
        "user" => $_SESSION['user'],
        "isAdmin" => $isAdmin  // můžeš poslat i zvlášť, pokud chceš
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Neplatné přihlašovací údaje."]);
}
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
