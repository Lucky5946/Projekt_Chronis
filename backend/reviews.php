<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true"); // důležité, aby cookie fungovala přes CORS

require_once 'connection.php';

try {
    $stmt = $conn->prepare("
        SELECT 
            r.id_recenze,
            CONCAT(z.jmeno, ' ', z.prijmeni) AS name,
            r.text_recenze AS text,
            f.logo_cesta,
            f.nazev
        FROM recenze r
        JOIN zamestnanci z ON r.id_zamestnanec = z.id_zamestnanec
        JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
        JOIN firmy f ON o.id_firma = f.id_firma
        ORDER BY r.id_recenze ASC;
    ");
    $stmt->execute();
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($reviews);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    exit();
}
