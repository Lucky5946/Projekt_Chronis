<?php

require __DIR__ . "/src/Support/api.php";

$conn = api_bootstrap(["GET"]);
$userId = api_user_id();

$statusMap = [
    "cekajici" => "pending",
    "schvaleno" => "approved",
    "zamitnuto" => "rejected",
];

try {
    $stmt = $conn->prepare("
        SELECT
            a.id_absence,
            a.datum_od,
            a.datum_do,
            a.cas_od,
            a.cas_do,
            a.misto,
            a.poznamka,
            a.stav,
            a.datum_podani,
            a.datum_schvaleni,
            a.poznamka_schvaleni,
            t.nazev AS typ,
            CONCAT(s.jmeno, ' ', s.prijmeni) AS schvalil
        FROM zadosti_absence a
        JOIN typy t ON a.id_typ = t.id_typ
        LEFT JOIN zamestnanci s ON a.id_schvalil = s.id_zamestnanec
        WHERE a.id_zamestnanec = :userId
        ORDER BY a.datum_podani DESC, a.id_absence DESC
    ");
    $stmt->execute([":userId" => $userId]);

    $requests = [];
    $summary = [
        "pending" => 0,
        "approved" => 0,
        "rejected" => 0,
    ];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $from = new DateTime($row['datum_od']);
        $to = new DateTime($row['datum_do']);
        $status = $statusMap[$row['stav']] ?? "pending";
        $summary[$status]++;

        $time = null;
        if (!empty($row['cas_od']) && !empty($row['cas_do'])) {
            $time = substr($row['cas_od'], 0, 5) . " - " . substr($row['cas_do'], 0, 5);
        }

        $requests[] = [
            "id" => (int)$row['id_absence'],
            "type" => $row['typ'],
            "from" => $row['datum_od'],
            "to" => $row['datum_do'],
            "time" => $time,
            "place" => $row['misto'],
            "days" => (int)$from->diff($to)->format('%a') + 1,
            "status" => $status,
            "reason" => $row['poznamka'],
            "submitted" => substr($row['datum_podani'], 0, 10),
            "approvedBy" => $row['schvalil'],
            "approvedAt" => $row['datum_schvaleni'],
            "approvalNote" => $row['poznamka_schvaleni'],
        ];
    }

    api_response([
        "success" => true,
        "summary" => $summary,
        "requests" => $requests,
    ]);
} catch (PDOException $e) {
    api_response(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()], 500);
}
