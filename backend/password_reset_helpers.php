<?php

function password_reset_app_url(): string
{
    $envPath = __DIR__ . "/config.env";
    $env = file_exists($envPath) ? parse_ini_file($envPath) : [];
    $appUrl = trim($env['APP_URL'] ?? 'http://localhost:5173');

    return rtrim($appUrl, '/');
}

function password_reset_create(PDO $conn, int $employeeId): array
{
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expiresAt = date('Y-m-d H:i:s', time() + 48 * 60 * 60);

    $invalidateStmt = $conn->prepare("
        UPDATE tokeny_hesel
        SET pouzito = 1
        WHERE id_zamestnanec = :employeeId AND pouzito = 0
    ");
    $invalidateStmt->execute([":employeeId" => $employeeId]);

    $stmt = $conn->prepare("
        INSERT INTO tokeny_hesel (id_zamestnanec, token_hash, platnost_do, pouzito, vytvoreno)
        VALUES (:employeeId, :tokenHash, :expiresAt, 0, NOW())
    ");
    $stmt->execute([
        ":employeeId" => $employeeId,
        ":tokenHash" => $tokenHash,
        ":expiresAt" => $expiresAt,
    ]);

    return [
        "token" => $token,
        "url" => password_reset_app_url() . "/nastavit_heslo?token=" . urlencode($token),
        "expiresAt" => $expiresAt,
    ];
}

function password_reset_autoload_path(): ?string
{
    $paths = [
        __DIR__ . "/../vendor/autoload.php",
        __DIR__ . "/../../vendor/autoload.php",
        dirname(__DIR__) . "/vendor/autoload.php",
        "C:/wamp64/www/vendor/autoload.php",
    ];

    foreach ($paths as $path) {
        if (file_exists($path)) {
            return $path;
        }
    }

    return null;
}

function password_reset_send_email(string $recipientEmail, string $recipientName, string $resetUrl): array
{
    $envPath = __DIR__ . "/config.env";
    $env = file_exists($envPath) ? parse_ini_file($envPath) : [];
    $emailUser = trim($env['EMAIL_USER'] ?? '');
    $emailPass = trim($env['EMAIL_PASS'] ?? '');

    if ($emailUser === '' || $emailPass === '') {
        return [
            "sent" => false,
            "message" => "Email nebyl odeslán, protože nejsou vyplněné SMTP údaje.",
        ];
    }

    $autoload = password_reset_autoload_path();
    if (!$autoload) {
        return [
            "sent" => false,
            "message" => "Email nebyl odeslán, protože není dostupný PHPMailer autoload.",
        ];
    }

    require_once $autoload;

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $mail->CharSet = 'UTF-8';
    $mail->Encoding = 'base64';

    try {
        $mail->isSMTP();
        $mail->Host = trim($env['SMTP_HOST'] ?? 'smtp.seznam.cz');
        $mail->SMTPAuth = true;
        $mail->Username = $emailUser;
        $mail->Password = $emailPass;
        $mail->SMTPSecure = trim($env['SMTP_SECURE'] ?? 'ssl');
        $mail->Port = (int)($env['SMTP_PORT'] ?? 465);

        $mail->setFrom($emailUser, 'Chronis');
        $mail->addAddress($recipientEmail, $recipientName);

        $safeName = htmlspecialchars($recipientName, ENT_QUOTES, 'UTF-8');
        $safeUrl = htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8');

        $mail->isHTML(true);
        $mail->Subject = 'Nastavení hesla do systému Chronis';
        $mail->Body = "
            <h2>Nastavení hesla</h2>
            <p>Dobrý den, {$safeName},</p>
            <p>byl vám vytvořen účet v docházkovém systému Chronis.</p>
            <p>Heslo si nastavíte kliknutím na tento odkaz:</p>
            <p><a href=\"{$safeUrl}\">Nastavit heslo</a></p>
            <p>Odkaz je platný 48 hodin.</p>
        ";
        $mail->AltBody = "Dobrý den, {$recipientName}, heslo do systému Chronis nastavíte zde: {$resetUrl}";

        $mail->send();

        return ["sent" => true, "message" => "Email s odkazem byl odeslán."];
    } catch (Throwable $e) {
        return [
            "sent" => false,
            "message" => "Email se nepodařilo odeslat: " . $mail->ErrorInfo,
        ];
    }
}
