<?php
require_once "connection.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

$data = json_decode(file_get_contents("php://input"), true);

// Validace potřebných polí
if (
    isset($data['id_firma'], $data['nazev'], $data['email'], $data['telefon'], $data['ico']) &&
    isset($data['id_adresa'], $data['ulice'], $data['cislo_popisne'])
) {
    try {
        $conn->beginTransaction();

        // 1. Aktualizace firmy
        $stmtFirma = $conn->prepare("
            UPDATE firmy SET
                nazev = ?, email = ?, telefon = ?, ico = ?
            WHERE id_firma = ?
        ");
        $stmtFirma->execute([
            $data['nazev'],
            $data['email'],
            $data['telefon'],
            $data['ico'],
            $data['id_firma']
        ]);

        // 2. Aktualizace adresy (včetně id_psc jako FK)
        $stmtAdresa = $conn->prepare("
            UPDATE adresy SET
                ulice = ?, cislo_popisne = ?
            WHERE id_adresa = ?
        ");
        $stmtAdresa->execute([
            $data['ulice'],
            $data['cislo_popisne'],
            $data['id_adresa']
        ]);


        $conn->commit();
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        $conn->rollBack();
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Chybějící pole"]);
}
