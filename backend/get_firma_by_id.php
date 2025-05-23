<?php
require_once "connection.php";
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true"); // důležité pro cookie přes CORS

// Pokud je to možností, můžeš na začátku obsloužit OPTIONS request:
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_GET["id"])) {
    http_response_code(400);
    echo json_encode(["error" => "Chybí parametr id"]);
    exit();
}

$id = $_GET["id"];

$stmt = $conn->prepare("
SELECT 
  f.*, 
  a.ulice, 
  a.cislo_popisne, 
  a.id_adresa
FROM firmy f
JOIN adresy a ON f.id_adresa = a.id_adresa
JOIN posty p ON a.id_psc = p.id_psc
WHERE f.id_firma = ?
");
$stmt->execute([$id]);

$firma = $stmt->fetch(PDO::FETCH_ASSOC);

if ($firma) {
    echo json_encode($firma);
} else {
    http_response_code(404);
    echo json_encode(["error" => "Firma nenalezena"]);
}
