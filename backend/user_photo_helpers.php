<?php

function user_photo_save(?string $dataUrl, ?string $currentPath = null): ?string
{
    $dataUrl = trim((string)$dataUrl);
    if ($dataUrl === "") {
        return $currentPath ?: null;
    }

    if (strpos($dataUrl, "uploads/users/") === 0) {
        return $dataUrl;
    }

    if (!preg_match('/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/', $dataUrl, $matches)) {
        throw new RuntimeException("Fotka musí být obrázek JPG, PNG nebo WEBP.");
    }

    $extension = $matches[1] === "jpeg" ? "jpg" : $matches[1];
    $bytes = base64_decode($matches[2], true);

    if ($bytes === false) {
        throw new RuntimeException("Fotku se nepodařilo zpracovat.");
    }

    if (strlen($bytes) > 2 * 1024 * 1024) {
        throw new RuntimeException("Fotka může mít maximálně 2 MB.");
    }

    $uploadDir = __DIR__ . "/uploads/users";
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true)) {
        throw new RuntimeException("Složku pro fotky se nepodařilo vytvořit.");
    }

    $fileName = "user_" . bin2hex(random_bytes(12)) . "." . $extension;
    $absolutePath = $uploadDir . "/" . $fileName;

    if (file_put_contents($absolutePath, $bytes) === false) {
        throw new RuntimeException("Fotku se nepodařilo uložit.");
    }

    return "uploads/users/" . $fileName;
}
