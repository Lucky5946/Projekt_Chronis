<?php
session_start(); // 🔴 musí být úplně první

require_once "connection.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true"); // důležité pro cookie přes CORS

try {
    // Používáme už vytvořené připojení z connection.php
$stmt = $conn->prepare("  SELECT 
            f.id_firma, 
            f.nazev, 
            f.email, 
            f.telefon, 
            p.obec,
            f.logo_cesta
        FROM firmy f
        LEFT JOIN adresy a ON f.id_adresa = a.id_adresa
        LEFT JOIN posty p ON a.id_psc = p.id_psc");
$stmt->execute();
$firmy = $stmt->fetchAll(PDO::FETCH_ASSOC);


    echo json_encode($firmy);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
