<?php

require __DIR__ . "/src/Support/api.php";
require __DIR__ . "/src/Repositories/MessageRepository.php";
require __DIR__ . "/src/Services/MessageService.php";

$conn = api_bootstrap(["GET", "POST"]);
$repository = new MessageRepository($conn);
$service = new MessageService($repository);

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        api_response([
            "success" => true,
            ...$service->inbox(api_user_id(), api_is_admin()),
        ]);
    }

    $data = api_json_input();
    $action = $data['action'] ?? "send";

    if ($action === "mark_read") {
        $service->markRead((int)($data['messageId'] ?? 0), api_user_id(), api_is_admin());
        api_response([
            "success" => true,
            "message" => "Zpráva byla označena jako přečtená.",
            ...$service->inbox(api_user_id(), api_is_admin()),
        ]);
    }

    $service->send(api_user_id(), $data);
    api_response([
        "success" => true,
        "message" => "Zpráva byla odeslána.",
        ...$service->inbox(api_user_id(), api_is_admin()),
    ]);
} catch (InvalidArgumentException $e) {
    api_response(["success" => false, "message" => $e->getMessage()], 400);
} catch (PDOException $e) {
    api_response(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()], 500);
}
