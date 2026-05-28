<?php

class MessageService
{
    private MessageRepository $messages;

    public function __construct(MessageRepository $messages)
    {
        $this->messages = $messages;
    }

    public function inbox(int $userId, bool $isAdmin): array
    {
        $messages = $this->messages->listForUser($userId, $isAdmin);
        $total = count($messages);
        $unread = count(array_filter($messages, fn($message) => (int)$message['precteno'] === 0));
        $notifications = count(array_filter($messages, fn($message) => in_array($message['typ'], ['upozorneni', 'notifikace'], true)));
        $systemMessages = count(array_filter($messages, fn($message) => $message['typ'] === 'system'));
        $directMessages = count(array_filter($messages, fn($message) => $message['typ'] === 'zprava'));

        return [
            "messages" => array_map(fn($message) => [
                "id" => (int)$message['id_zprava'],
                "subject" => $message['predmet'],
                "text" => $message['text_zpravy'],
                "type" => $message['typ'],
                "senderId" => $message['id_odesilatel'] !== null ? (int)$message['id_odesilatel'] : null,
                "sender" => $message['odesilatel'] ?: "Systém Chronis",
                "senderEmail" => $message['odesilatel_email'],
                "createdAt" => $message['vytvoreno'],
                "read" => (int)$message['precteno'] === 1,
                "readAt" => $message['precteno_dne'],
            ], $messages),
            "recipients" => $this->messages->listRecipients(),
            "stats" => [
                "total" => $total,
                "unread" => $unread,
                "read" => $total - $unread,
                "notifications" => $notifications,
                "system" => $systemMessages,
                "messages" => $directMessages,
            ],
        ];
    }

    public function send(int $senderId, array $data): void
    {
        $recipientId = (int)($data['recipientId'] ?? 0);
        $subject = trim($data['subject'] ?? "");
        $body = trim($data['body'] ?? "");

        if ($recipientId <= 0 || $subject === "" || $body === "") {
            throw new InvalidArgumentException("Vyplňte příjemce, předmět i text zprávy.");
        }

        $this->messages->create($senderId, $recipientId, $subject, $body);
    }

    public function notifyAdmins(string $subject, string $body): void
    {
        foreach ($this->messages->listAdminIds() as $adminId) {
            $this->messages->createSystemMessage($adminId, $subject, $body, "upozorneni");
        }
    }

    public function markRead(int $messageId, int $userId, bool $isAdmin): void
    {
        if ($messageId <= 0 || !$this->messages->markRead($messageId, $userId, $isAdmin)) {
            throw new InvalidArgumentException("Zprávu se nepodařilo označit jako přečtenou.");
        }
    }
}
