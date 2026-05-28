<?php

class MessageRepository
{
    private PDO $conn;

    public function __construct(PDO $conn)
    {
        $this->conn = $conn;
    }

    public function listForUser(int $userId, bool $isAdmin): array
    {
        $where = $isAdmin
            ? "(z.id_prijemce = :userId OR z.id_prijemce IS NULL)"
            : "z.id_prijemce = :userId";

        $stmt = $this->conn->prepare("
            SELECT
                z.id_zprava,
                z.id_odesilatel,
                z.id_prijemce,
                z.predmet,
                z.text_zpravy,
                z.typ,
                z.precteno,
                z.vytvoreno,
                z.precteno_dne,
                CONCAT(o.jmeno, ' ', o.prijmeni) AS odesilatel,
                o.email AS odesilatel_email
            FROM zpravy z
            LEFT JOIN zamestnanci o ON z.id_odesilatel = o.id_zamestnanec
            WHERE $where
            ORDER BY z.vytvoreno DESC, z.id_zprava DESC
        ");
        $stmt->execute([":userId" => $userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listRecipients(): array
    {
        $stmt = $this->conn->query("
            SELECT id_zamestnanec, CONCAT(jmeno, ' ', prijmeni) AS jmeno, email
            FROM zamestnanci
            WHERE aktivni = 1
            ORDER BY prijmeni ASC, jmeno ASC
        ");

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listAdminIds(): array
    {
        $stmt = $this->conn->query("
            SELECT id_zamestnanec
            FROM zamestnanci
            WHERE aktivni = 1 AND id_pozice = 1
            ORDER BY id_zamestnanec ASC
        ");

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    public function create(int $senderId, int $recipientId, string $subject, string $body): void
    {
        $stmt = $this->conn->prepare("
            INSERT INTO zpravy (id_odesilatel, id_prijemce, predmet, text_zpravy, typ)
            VALUES (:senderId, :recipientId, :subject, :body, 'zprava')
        ");
        $stmt->execute([
            ":senderId" => $senderId,
            ":recipientId" => $recipientId,
            ":subject" => $subject,
            ":body" => $body,
        ]);
    }

    public function createSystemMessage(?int $recipientId, string $subject, string $body, string $type = "upozorneni"): void
    {
        $stmt = $this->conn->prepare("
            INSERT INTO zpravy (id_odesilatel, id_prijemce, predmet, text_zpravy, typ)
            VALUES (NULL, :recipientId, :subject, :body, :type)
        ");
        $stmt->execute([
            ":recipientId" => $recipientId,
            ":subject" => $subject,
            ":body" => $body,
            ":type" => $type,
        ]);
    }

    public function markRead(int $messageId, int $userId, bool $isAdmin): bool
    {
        $where = $isAdmin
            ? "(id_prijemce = :userId OR id_prijemce IS NULL)"
            : "id_prijemce = :userId";

        $stmt = $this->conn->prepare("
            UPDATE zpravy
            SET precteno = 1, precteno_dne = NOW()
            WHERE id_zprava = :messageId AND $where
        ");
        $stmt->execute([
            ":messageId" => $messageId,
            ":userId" => $userId,
        ]);

        return $stmt->rowCount() > 0;
    }
}
