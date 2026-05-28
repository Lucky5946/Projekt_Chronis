<?php

function shift_time_to_minutes(?string $time): int
{
    if (!$time || !preg_match('/^(\d{2}):(\d{2})/', $time, $matches)) {
        return 0;
    }

    return ((int)$matches[1] * 60) + (int)$matches[2];
}

function shift_minutes_to_time(int $minutes): string
{
    $minutes = (($minutes % 1440) + 1440) % 1440;
    $hours = intdiv($minutes, 60);
    $mins = $minutes % 60;

    return sprintf('%02d:%02d:00', $hours, $mins);
}

function shift_expected_minutes(array $shift): int
{
    $configured = (int)($shift['uvazek_minut'] ?? 0);
    if ($configured > 0) {
        return $configured;
    }

    $from = shift_time_to_minutes($shift['cas_od'] ?? null);
    $to = shift_time_to_minutes($shift['cas_do'] ?? null);
    $duration = $to - $from;

    return $duration > 0 ? $duration : $duration + 1440;
}

function shift_late_limit(array $shift): string
{
    $start = shift_time_to_minutes($shift['cas_od'] ?? '07:00:00');
    $tolerance = max(0, (int)($shift['tolerance_minut'] ?? 10));

    return shift_minutes_to_time($start + $tolerance);
}

function shift_default_fallback(): array
{
    return [
        "id_smena" => null,
        "nazev" => "Výchozí směna",
        "cas_od" => "07:00:00",
        "cas_do" => "15:30:00",
        "tolerance_minut" => 10,
        "uvazek_minut" => 480,
        "aktivni" => 1,
    ];
}

function get_shift_for_employee(PDO $conn, int $employeeId, ?string $date = null): array
{
    $date = $date ?: date('Y-m-d');

    $plannedStmt = $conn->prepare("
        SELECT s.*
        FROM plan_smen ps
        JOIN smeny s ON ps.id_smena = s.id_smena
        WHERE ps.id_zamestnanec = :employeeId
            AND ps.datum = :workDate
            AND s.aktivni = 1
        LIMIT 1
    ");

    try {
        $plannedStmt->execute([
            ":employeeId" => $employeeId,
            ":workDate" => $date,
        ]);
        $planned = $plannedStmt->fetch(PDO::FETCH_ASSOC);
        if ($planned) {
            return $planned;
        }
    } catch (PDOException $e) {
        // Older databases may not have shift tables before running the migration.
    }

    try {
        $defaultStmt = $conn->prepare("
            SELECT s.*
            FROM zamestnanci z
            JOIN smeny s ON z.id_vychozi_smena = s.id_smena
            WHERE z.id_zamestnanec = :employeeId
                AND s.aktivni = 1
            LIMIT 1
        ");
        $defaultStmt->execute([":employeeId" => $employeeId]);
        $default = $defaultStmt->fetch(PDO::FETCH_ASSOC);
        if ($default) {
            return $default;
        }

        $firstShift = $conn->query("
            SELECT *
            FROM smeny
            WHERE aktivni = 1
            ORDER BY id_smena ASC
            LIMIT 1
        ")->fetch(PDO::FETCH_ASSOC);

        if ($firstShift) {
            return $firstShift;
        }
    } catch (PDOException $e) {
        // Fall back to the previous fixed shift when schema is not migrated yet.
    }

    return shift_default_fallback();
}

function shift_payload(array $shift): array
{
    return [
        "id_smena" => isset($shift['id_smena']) ? (int)$shift['id_smena'] : null,
        "nazev" => $shift['nazev'] ?? "Výchozí směna",
        "casOd" => substr($shift['cas_od'] ?? "07:00:00", 0, 5),
        "casDo" => substr($shift['cas_do'] ?? "15:30:00", 0, 5),
        "toleranceMinut" => (int)($shift['tolerance_minut'] ?? 10),
        "uvazekMinut" => shift_expected_minutes($shift),
    ];
}
