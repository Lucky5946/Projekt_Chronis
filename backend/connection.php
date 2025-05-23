<?php
// config.php - připojení k databázi pomocí PDO

$servername = "localhost";
$username = "root";
$password = "";  // u WAMP většinou prázdné
$dbname = "chronisdb";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    // Nastavení režimu chyb na výjimky
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
    exit();
}
