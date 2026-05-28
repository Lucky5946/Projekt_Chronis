<?php

function api_bootstrap(array $methods, bool $adminOnly = false): PDO
{
    session_start();

    header("Content-Type: application/json; charset=utf-8");
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Methods: " . implode(", ", array_merge($methods, ["OPTIONS"])));
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Credentials: true");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    if (!in_array($_SERVER['REQUEST_METHOD'], $methods, true)) {
        api_response(["success" => false, "message" => "Nepovolená metoda."], 405);
    }

    require __DIR__ . "/../../connection.php";

    if (!isset($_SESSION['user']['id'])) {
        api_response(["success" => false, "message" => "Uživatel není přihlášen."], 401);
    }

    if ($adminOnly && (!isset($_SESSION['user']['isAdmin']) || $_SESSION['user']['isAdmin'] !== true)) {
        api_response(["success" => false, "message" => "Přístup odepřen."], 403);
    }

    return $conn;
}

function api_user_id(): int
{
    return (int)$_SESSION['user']['id'];
}

function api_is_admin(): bool
{
    return isset($_SESSION['user']['isAdmin']) && $_SESSION['user']['isAdmin'] === true;
}

function api_json_input(): array
{
    $data = json_decode(file_get_contents("php://input"), true);

    return is_array($data) ? $data : [];
}

function api_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit();
}
