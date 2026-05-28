<?php

function current_user_id(): int
{
    return (int)($_SESSION['user']['id'] ?? 0);
}

function current_user_position(): int
{
    return (int)($_SESSION['user']['pozice'] ?? 0);
}

function current_user_is_admin(): bool
{
    return current_user_position() === 1 || (isset($_SESSION['user']['isAdmin']) && $_SESSION['user']['isAdmin'] === true);
}

function current_user_is_manager(): bool
{
    return current_user_position() === 2 || (isset($_SESSION['user']['isManager']) && $_SESSION['user']['isManager'] === true);
}

function require_admin_or_manager(): void
{
    if (!isset($_SESSION['user']) || (!current_user_is_admin() && !current_user_is_manager())) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Přístup odepřen."]);
        exit();
    }
}

function require_admin(): void
{
    if (!isset($_SESSION['user']) || !current_user_is_admin()) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Přístup odepřen."]);
        exit();
    }
}

function current_user_company_id(PDO $conn): ?int
{
    $stmt = $conn->prepare("
        SELECT o.id_firma
        FROM zamestnanci z
        LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
        WHERE z.id_zamestnanec = :userId
        LIMIT 1
    ");
    $stmt->execute([":userId" => current_user_id()]);
    $companyId = $stmt->fetchColumn();

    return $companyId !== false && $companyId !== null ? (int)$companyId : null;
}

function department_belongs_to_manager_company(PDO $conn, int $departmentId): bool
{
    if (current_user_is_admin()) {
        return true;
    }

    $companyId = current_user_company_id($conn);
    if (!$companyId) {
        return false;
    }

    $stmt = $conn->prepare("
        SELECT COUNT(*)
        FROM oddeleni
        WHERE id_oddeleni = :departmentId AND id_firma = :companyId
    ");
    $stmt->execute([
        ":departmentId" => $departmentId,
        ":companyId" => $companyId,
    ]);

    return (int)$stmt->fetchColumn() > 0;
}
