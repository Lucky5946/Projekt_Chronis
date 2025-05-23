<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ✅ CORS hlavičky (jen jednou, ne duplicitně)
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// ✅ Preflight požadavek (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ✅ Composer autoload
require __DIR__ . '/../vendor/autoload.php';

// ✅ Načti JSON vstup
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "Neplatný JSON vstup."]);
    exit;
}

// ✅ Bezpečné zpracování vstupů
$name = htmlspecialchars(trim($data['name'] ?? ''));
$company = htmlspecialchars(trim($data['company'] ?? ''));
$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$message = htmlspecialchars(trim($data['message'] ?? ''));
$env = parse_ini_file(__DIR__ . '/config.env');
// ✅ Načti přihlašovací údaje z .env souboru

if (!$env || !isset($env['EMAIL_USER'], $env['EMAIL_PASS'])) {
    http_response_code(500);
    echo json_encode(["error" => "Chybí konfigurace e-mailu."]);
    exit;
}
$emailUser = $env['EMAIL_USER'];
$emailPass = $env['EMAIL_PASS'];
if (!$email) {
    http_response_code(400);
    echo json_encode(["error" => "Neplatný e-mail."]);
    exit;
}

// ✅ Odeslání e-mailu přes PHPMailer
$mail = new PHPMailer(true);
$mail->CharSet = 'UTF-8';
$mail->Encoding = 'base64';
try {
$mail->isSMTP();
$mail->Host       = 'smtp.seznam.cz';
$mail->SMTPAuth   = true;
$mail->Username   = $emailUser;
$mail->Password   = $emailPass;
$mail->SMTPSecure = 'ssl';
$mail->Port       = 465;

$mail->setFrom($emailUser, 'Webový formulář Chronis');
$mail->addAddress($emailUser, 'Příjemce');

$mail->isHTML(true);
$mail->Subject = 'Nová zpráva z formuláře';
$mail->Body    = "
    <h3>Nová zpráva o schůzku:</h3>
    <p><strong>Jméno:</strong> $name</p>
    <p><strong>Firma:</strong> $company</p>
    <p><strong>Email:</strong> $email</p>
    <p><strong>Zpráva:</strong><br>$message</p>
";

$mail->send();
    echo json_encode(["success" => "Zpráva byla úspěšně odeslána."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Chyba při odesílání: {$mail->ErrorInfo}"]);
}
