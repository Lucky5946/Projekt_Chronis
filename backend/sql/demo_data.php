<?php

require __DIR__ . "/../connection.php";

function upsert(PDO $conn, string $sql, array $params): void
{
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
}

function table_column_exists(PDO $conn, string $table, string $column): bool
{
    $stmt = $conn->prepare("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = :tableName
            AND COLUMN_NAME = :columnName
    ");
    $stmt->execute([
        ":tableName" => $table,
        ":columnName" => $column,
    ]);

    return (int)$stmt->fetchColumn() > 0;
}

function shift_id(PDO $conn, string $name): int
{
    $stmt = $conn->prepare("SELECT id_smena FROM smeny WHERE nazev = :name LIMIT 1");
    $stmt->execute([":name" => $name]);

    return (int)$stmt->fetchColumn();
}

function type_id(PDO $conn, string $name): int
{
    $stmt = $conn->prepare("SELECT id_typ FROM typy WHERE nazev = :name LIMIT 1");
    $stmt->execute([":name" => $name]);

    return (int)$stmt->fetchColumn();
}

function work_minutes(string $start, string $end, int $breakMinutes, int $awayMinutes = 0): int
{
    $startTime = strtotime("2026-05-01 " . $start);
    $endTime = strtotime("2026-05-01 " . $end);

    return max(0, (int)(($endTime - $startTime) / 60) - $breakMinutes - $awayMinutes);
}

function insert_attendance_day(PDO $conn, int $employeeId, string $date, string $start, string $end, int $breakMinutes, int $awayMinutes, string $status, string $note): void
{
    $stmt = $conn->prepare("
        INSERT INTO dochazka_dny
            (id_zamestnanec, datum, prichod, odchod, pauza_minut, mimo_pracoviste_minut, odpracovano_minut, stav, poznamka)
        VALUES
            (:employeeId, :dateValue, :startValue, :endValue, :breakMinutes, :awayMinutes, :workedMinutes, :statusValue, :note)
    ");
    $stmt->execute([
        ":employeeId" => $employeeId,
        ":dateValue" => $date,
        ":startValue" => $start,
        ":endValue" => $end,
        ":breakMinutes" => $breakMinutes,
        ":awayMinutes" => $awayMinutes,
        ":workedMinutes" => work_minutes($start, $end, $breakMinutes, $awayMinutes),
        ":statusValue" => $status,
        ":note" => $note,
    ]);

    $dayId = (int)$conn->lastInsertId();
    $events = [
        ["prichod", $date . " " . $start],
        ["zacatek_pauzy", $date . " 11:45:00"],
        ["konec_pauzy", $date . " 12:15:00"],
        ["odchod", $date . " " . $end],
    ];

    $eventStmt = $conn->prepare("
        INSERT INTO dochazka_udalosti (id_zamestnanec, id_dochazka_den, typ, cas_udalosti, zdroj, poznamka)
        VALUES (:employeeId, :dayId, :eventType, :eventTime, 'web', :note)
    ");

    foreach ($events as [$eventType, $eventTime]) {
        $eventStmt->execute([
            ":employeeId" => $employeeId,
            ":dayId" => $dayId,
            ":eventType" => $eventType,
            ":eventTime" => $eventTime,
            ":note" => $eventType === "odchod" && $awayMinutes > 0 ? "Součástí dne byl odchod mimo pracoviště." : null,
        ]);
    }
}

try {
    $conn->beginTransaction();

    if (table_column_exists($conn, "dochazka_udalosti", "typ")) {
        $conn->exec("
            ALTER TABLE dochazka_udalosti
            MODIFY typ ENUM('prichod','odchod','zacatek_pauzy','konec_pauzy','odchod_mimo_pracoviste','navrat_na_pracoviste')
            NOT NULL
        ");
    }

    $password = password_hash("Chronis2026!", PASSWORD_DEFAULT);

    foreach ([
        [1, "Administrátor"],
        [2, "Vedoucí směny"],
        [3, "Zaměstnanec"],
    ] as [$id, $name]) {
        upsert($conn, "
            INSERT INTO pozice (id_pozice, nazev)
            VALUES (:id, :name)
            ON DUPLICATE KEY UPDATE nazev = VALUES(nazev)
        ", [":id" => $id, ":name" => $name]);
    }

    foreach ([
        [1, "Dovolená"],
        [2, "Nemoc"],
        [3, "Lékař"],
        [4, "Home office"],
        [5, "Propustka"],
    ] as [$id, $name]) {
        upsert($conn, "
            INSERT INTO typy (id_typ, nazev)
            VALUES (:id, :name)
            ON DUPLICATE KEY UPDATE nazev = VALUES(nazev)
        ", [":id" => $id, ":name" => $name]);
    }

    foreach ([
        ["53002", "Pardubice"],
        ["60200", "Brno"],
        ["30100", "Plzeň"],
    ] as [$psc, $city]) {
        upsert($conn, "
            INSERT INTO posty (id_psc, obec)
            VALUES (:psc, :city)
            ON DUPLICATE KEY UPDATE obec = VALUES(obec)
        ", [":psc" => $psc, ":city" => $city]);
    }

    foreach ([
        [101, "Tovární", "128", "53002"],
        [102, "Technologická", "42", "60200"],
        [103, "Průmyslová", "17", "30100"],
    ] as [$id, $street, $number, $psc]) {
        upsert($conn, "
            INSERT INTO adresy (id_adresa, ulice, cislo_popisne, id_psc)
            VALUES (:id, :street, :numberValue, :psc)
            ON DUPLICATE KEY UPDATE
                ulice = VALUES(ulice),
                cislo_popisne = VALUES(cislo_popisne),
                id_psc = VALUES(id_psc)
        ", [
            ":id" => $id,
            ":street" => $street,
            ":numberValue" => $number,
            ":psc" => $psc,
        ]);
    }

    foreach ([
        [101, "Manufactory Lab Pardubice", "28491537", "pardubice@manufactory-lab.com", "+420 466 018 240", 101, "images/loga/manufactory-lab-pardubice.png", 25],
        [102, "Chronis Components", "71954826", "components@manufactory-lab.com", "+420 541 218 630", 102, "images/loga/chronis-components.png", 30],
        [103, "Factory Vision", "63047218", "vision@manufactory-lab.com", "+420 377 321 445", 103, "images/loga/factory-vision.png", 28],
    ] as [$id, $name, $ico, $email, $phone, $addressId, $logo, $vacationDays]) {
        upsert($conn, "
            INSERT INTO firmy (id_firma, nazev, ico, email, telefon, id_adresa, logo_cesta, dovolena_dni)
            VALUES (:id, :name, :ico, :email, :phone, :addressId, :logo, :vacationDays)
            ON DUPLICATE KEY UPDATE
                nazev = VALUES(nazev),
                ico = VALUES(ico),
                email = VALUES(email),
                telefon = VALUES(telefon),
                id_adresa = VALUES(id_adresa),
                logo_cesta = VALUES(logo_cesta),
                dovolena_dni = VALUES(dovolena_dni)
        ", [
            ":id" => $id,
            ":name" => $name,
            ":ico" => $ico,
            ":email" => $email,
            ":phone" => $phone,
            ":addressId" => $addressId,
            ":logo" => $logo,
            ":vacationDays" => $vacationDays,
        ]);
    }

    foreach ([
        [101, 101, "Výroba"],
        [102, 101, "Administrativa"],
        [103, 101, "Logistika"],
        [104, 102, "Montáž"],
        [105, 102, "Kontrola kvality"],
        [106, 103, "Servis"],
        [107, 103, "Vývoj"],
    ] as [$id, $companyId, $name]) {
        upsert($conn, "
            INSERT INTO oddeleni (id_oddeleni, id_firma, nazev)
            VALUES (:id, :companyId, :name)
            ON DUPLICATE KEY UPDATE id_firma = VALUES(id_firma), nazev = VALUES(nazev)
        ", [":id" => $id, ":companyId" => $companyId, ":name" => $name]);
    }

    $morningShift = shift_id($conn, "Ranní směna");
    $afternoonShift = shift_id($conn, "Odpolední směna");
    $nightShift = shift_id($conn, "Noční směna");
    $partTimeShift = shift_id($conn, "Zkrácený úvazek");

    $employees = [
        [101, "Lukáš", "Mareš", "lukas.mares@manufactory-lab.com", "+420 777 101 101", "CHRON10101", 36000, "2024-09-01", 1, 102, $morningShift, "demo.admin", "uploads/users/demo-employee-01.png"],
        [102, "Tomáš", "Dvořák", "tomas.dvorak@manufactory-lab.com", "+420 777 101 102", "CHRON10102", 31000, "2024-10-14", 2, 101, $morningShift, "demo.vedouci", "uploads/users/demo-employee-02.png"],
        [103, "Petra", "Svobodová", "petra.svobodova@manufactory-lab.com", "+420 777 101 103", "CHRON10103", 28500, "2025-01-06", 3, 101, $morningShift, "demo.zamestnanec", "uploads/users/demo-employee-03.png"],
        [104, "Jan", "Novák", "jan.novak@manufactory-lab.com", "+420 777 101 104", "CHRON10104", 29500, "2025-02-03", 3, 103, $afternoonShift, "demo.logistika", "uploads/users/demo-employee-04.png"],
        [105, "Karolína", "Veselá", "karolina.vesela@manufactory-lab.com", "+420 777 101 105", "CHRON10105", 33500, "2024-11-18", 2, 104, $afternoonShift, "demo.vedouci2", "uploads/users/demo-employee-05.png"],
        [106, "Martin", "Černý", "martin.cerny@manufactory-lab.com", "+420 777 101 106", "CHRON10106", 30500, "2025-03-10", 3, 104, $nightShift, "demo.nocni", "uploads/users/demo-employee-06.png"],
        [107, "Eva", "Kučerová", "eva.kucerova@manufactory-lab.com", "+420 777 101 107", "CHRON10107", 26000, "2025-04-01", 3, 105, $partTimeShift, "demo.zkraceny", "uploads/users/demo-employee-07.png"],
        [108, "Michal", "Procházka", "michal.prochazka@manufactory-lab.com", "+420 777 101 108", "CHRON10108", 39000, "2023-08-21", 2, 107, $morningShift, "demo.vyvoj", "uploads/users/demo-employee-01.png"],
        [109, "Anna", "Horáková", "anna.horakova@manufactory-lab.com", "+420 777 101 109", "CHRON10109", 32000, "2024-06-12", 3, 107, $morningShift, "demo.vyvojar", "uploads/users/demo-employee-02.png"],
    ];

    foreach ($employees as [$id, $firstName, $lastName, $email, $phone, $chip, $wage, $startDate, $positionId, $departmentId, $shiftId, $login, $photo]) {
        upsert($conn, "
            INSERT INTO zamestnanci
                (id_zamestnanec, jmeno, prijmeni, email, telefon, fotka_cesta, cip, mzda, datum_nastupu, id_pozice, id_oddeleni, id_vychozi_smena, prihlasovaci_jmeno, heslo, aktivni)
            VALUES
                (:id, :firstName, :lastName, :email, :phone, :photo, :chip, :wage, :startDate, :positionId, :departmentId, :shiftId, :login, :passwordValue, 1)
            ON DUPLICATE KEY UPDATE
                jmeno = VALUES(jmeno),
                prijmeni = VALUES(prijmeni),
                email = VALUES(email),
                telefon = VALUES(telefon),
                fotka_cesta = VALUES(fotka_cesta),
                cip = VALUES(cip),
                mzda = VALUES(mzda),
                datum_nastupu = VALUES(datum_nastupu),
                id_pozice = VALUES(id_pozice),
                id_oddeleni = VALUES(id_oddeleni),
                id_vychozi_smena = VALUES(id_vychozi_smena),
                prihlasovaci_jmeno = VALUES(prihlasovaci_jmeno),
                aktivni = 1
        ", [
            ":id" => $id,
            ":firstName" => $firstName,
            ":lastName" => $lastName,
            ":email" => $email,
            ":phone" => $phone,
            ":photo" => $photo,
            ":chip" => $chip,
            ":wage" => $wage,
            ":startDate" => $startDate,
            ":positionId" => $positionId,
            ":departmentId" => $departmentId,
            ":shiftId" => $shiftId,
            ":login" => $login,
            ":passwordValue" => $password,
        ]);
    }

    $employeeIds = array_column($employees, 0);
    $placeholders = implode(",", array_fill(0, count($employeeIds), "?"));
    $conn->prepare("DELETE FROM dochazka_udalosti WHERE id_zamestnanec IN ($placeholders)")->execute($employeeIds);
    $conn->prepare("DELETE FROM dochazka_dny WHERE id_zamestnanec IN ($placeholders)")->execute($employeeIds);
    $conn->prepare("DELETE FROM plan_smen WHERE id_zamestnanec IN ($placeholders)")->execute($employeeIds);
    $conn->prepare("DELETE FROM zadosti_absence WHERE id_zamestnanec IN ($placeholders)")->execute($employeeIds);
    $conn->prepare("DELETE FROM recenze WHERE id_zamestnanec IN ($placeholders)")->execute($employeeIds);
    $conn->prepare("DELETE FROM zpravy WHERE id_odesilatel IN ($placeholders) OR id_prijemce IN ($placeholders)")->execute(array_merge($employeeIds, $employeeIds));
    $conn->prepare("DELETE FROM exporty WHERE id_vytvoril IN ($placeholders)")->execute($employeeIds);

    $shiftPlanStmt = $conn->prepare("
        INSERT INTO plan_smen (id_zamestnanec, datum, id_smena, poznamka)
        VALUES (:employeeId, :dateValue, :shiftId, :note)
    ");

    $attendanceStart = new DateTimeImmutable("2026-05-04");
    for ($day = 0; $day < 18; $day++) {
        $date = $attendanceStart->modify("+{$day} days");
        if ((int)$date->format("N") >= 6) {
            continue;
        }

        foreach ($employees as [$employeeId,,,,,,,,,, $shiftId]) {
            $shiftPlanStmt->execute([
                ":employeeId" => $employeeId,
                ":dateValue" => $date->format("Y-m-d"),
                ":shiftId" => $shiftId,
                ":note" => "Demo plán směny",
            ]);
        }
    }

    $attendanceRows = [
        [103, "2026-05-04", "06:02:00", "14:08:00", 30, 0, "pritomen", "Běžný pracovní den."],
        [103, "2026-05-05", "06:14:00", "14:04:00", 30, 0, "pozdni_prichod", "Pozdní příchod kvůli dopravě."],
        [103, "2026-05-06", "05:58:00", "14:02:00", 30, 0, "pritomen", "Uzavřená směna."],
        [103, "2026-05-07", "06:01:00", "14:12:00", 30, 45, "pritomen", "Krátký odchod mimo pracoviště."],
        [103, "2026-05-11", "06:00:00", "14:05:00", 30, 0, "pritomen", "Plná směna."],
        [104, "2026-05-04", "14:01:00", "22:05:00", 30, 0, "pritomen", "Odpolední směna."],
        [104, "2026-05-05", "14:16:00", "22:06:00", 30, 0, "pozdni_prichod", "Zdržení při předání materiálu."],
        [104, "2026-05-06", "14:00:00", "22:00:00", 30, 0, "pritomen", "Uzavřená směna."],
        [106, "2026-05-04", "22:00:00", "23:59:00", 15, 0, "neuzavreno", "Noční směna rozpracovaná v demodatech."],
        [107, "2026-05-04", "08:01:00", "12:05:00", 0, 0, "pritomen", "Zkrácený úvazek."],
        [107, "2026-05-05", "08:00:00", "12:00:00", 0, 0, "pritomen", "Zkrácený úvazek."],
        [109, "2026-05-04", "07:58:00", "16:05:00", 30, 0, "pritomen", "Vývojový tým."],
        [109, "2026-05-05", "08:09:00", "16:18:00", 30, 0, "pritomen", "Vývojový tým."],
    ];

    foreach ($attendanceRows as $row) {
        insert_attendance_day($conn, ...$row);
    }

    $vacationType = type_id($conn, "Dovolená");
    $doctorType = type_id($conn, "Lékař");
    $homeOfficeType = type_id($conn, "Home office");
    $passType = type_id($conn, "Propustka");

    foreach ([
        [103, $vacationType, "2026-06-10", "2026-06-14", null, null, null, "Rodinná dovolená", "schvaleno", 102, "Schváleno, kapacita směny zajištěna."],
        [104, $doctorType, "2026-05-29", "2026-05-29", "09:00:00", "11:30:00", "Ordinace Pardubice", "Pravidelná kontrola", "cekajici", null, null],
        [106, $passType, "2026-05-30", "2026-05-30", "13:00:00", "15:00:00", "Úřad práce", "Vyřízení osobních dokladů", "cekajici", null, null],
        [107, $homeOfficeType, "2026-06-03", "2026-06-03", null, null, null, "Inventura dokumentace z domova", "zamitnuto", 105, "V daný den je plánovaná fyzická kontrola kvality."],
        [109, $vacationType, "2026-07-01", "2026-07-05", null, null, null, "Letní dovolená", "schvaleno", 108, "Schváleno vedoucím vývoje."],
    ] as [$employeeId, $typeId, $from, $to, $timeFrom, $timeTo, $place, $note, $status, $approvedBy, $approvalNote]) {
        upsert($conn, "
            INSERT INTO zadosti_absence
                (datum_od, datum_do, cas_od, cas_do, misto, poznamka, id_zamestnanec, id_typ, stav, id_schvalil, datum_schvaleni, poznamka_schvaleni)
            VALUES
                (:fromDate, :toDate, :timeFrom, :timeTo, :place, :note, :employeeId, :typeId, :statusValue, :approvedBy, :approvedAt, :approvalNote)
        ", [
            ":fromDate" => $from,
            ":toDate" => $to,
            ":timeFrom" => $timeFrom,
            ":timeTo" => $timeTo,
            ":place" => $place,
            ":note" => $note,
            ":employeeId" => $employeeId,
            ":typeId" => $typeId,
            ":statusValue" => $status,
            ":approvedBy" => $approvedBy,
            ":approvedAt" => $approvedBy ? "2026-05-28 10:15:00" : null,
            ":approvalNote" => $approvalNote,
        ]);
    }

    foreach ([
        [101, 102, "Přehled žádostí za květen", "Prosím zkontrolujte čekající žádosti před páteční poradou.", "zprava", 0],
        [102, 103, "Schválená dovolená", "Vaše dovolená na červen je schválená. Užijte si volno.", "upozorneni", 1],
        [null, 104, "Nová žádost čeká na doplnění", "U propustky prosím doplňte místo návštěvy.", "system", 0],
        [105, 106, "Předání noční směny", "Zkontrolujte prosím stav linky B před začátkem směny.", "zprava", 0],
        [108, 109, "Report vývoje", "Docházkový report za tým vypadá v pořádku.", "zprava", 1],
    ] as [$senderId, $recipientId, $subject, $text, $type, $read]) {
        upsert($conn, "
            INSERT INTO zpravy (id_odesilatel, id_prijemce, predmet, text_zpravy, typ, precteno, precteno_dne)
            VALUES (:senderId, :recipientId, :subject, :textValue, :typeValue, :readValue, :readAt)
        ", [
            ":senderId" => $senderId,
            ":recipientId" => $recipientId,
            ":subject" => $subject,
            ":textValue" => $text,
            ":typeValue" => $type,
            ":readValue" => $read,
            ":readAt" => $read ? "2026-05-28 12:30:00" : null,
        ]);
    }

    foreach ([
        [103, 5, "schvaleno", "Chronis je přehledný a příchody se zapisují rychleji než v tabulkách."],
        [104, 4, "cekajici", "Líbí se mi přehled směn, jen bych časem ocenil více filtrů v historii."],
        [105, 5, "schvaleno", "Schvalování absencí a reporty mi šetří čas při plánování směn."],
        [107, 4, "schvaleno", "U zkráceného úvazku mi systém dobře ukazuje odpracovaný čas."],
        [109, 5, "schvaleno", "Dashboard pro zaměstnance je jednoduchý a rychle najdu vše podstatné."],
    ] as [$employeeId, $rating, $status, $text]) {
        upsert($conn, "
            INSERT INTO recenze (id_zamestnanec, hodnoceni, stav, text_recenze)
            VALUES (:employeeId, :rating, :statusValue, :textValue)
        ", [
            ":employeeId" => $employeeId,
            ":rating" => $rating,
            ":statusValue" => $status,
            ":textValue" => $text,
        ]);
    }

    foreach ([
        ["dochazka", "xlsx", "dochazka_kveten_2026.xlsx", "exports/dochazka_kveten_2026.xlsx", "2026-05-01", "2026-05-31", "hotovo", 101],
        ["absence", "csv", "absence_q2_2026.csv", "exports/absence_q2_2026.csv", "2026-04-01", "2026-06-30", "hotovo", 102],
        ["uzivatele", "xlsx", "uzivatele_demo.xlsx", "exports/uzivatele_demo.xlsx", null, null, "pripraveno", 101],
    ] as [$type, $format, $fileName, $path, $from, $to, $status, $createdBy]) {
        upsert($conn, "
            INSERT INTO exporty (typ, format, nazev_souboru, cesta_souboru, obdobi_od, obdobi_do, stav, id_vytvoril)
            VALUES (:typeValue, :formatValue, :fileName, :pathValue, :fromDate, :toDate, :statusValue, :createdBy)
        ", [
            ":typeValue" => $type,
            ":formatValue" => $format,
            ":fileName" => $fileName,
            ":pathValue" => $path,
            ":fromDate" => $from,
            ":toDate" => $to,
            ":statusValue" => $status,
            ":createdBy" => $createdBy,
        ]);
    }

    foreach ([
        ["dovolena_default_dni", "25", "Výchozí roční nárok dovolené v systému.", "number"],
        ["dochazka_tolerance_minut", "10", "Výchozí tolerance pozdního příchodu.", "number"],
        ["notifikace_absence", "1", "Odesílat notifikace při nové žádosti o absenci.", "boolean"],
    ] as [$key, $value, $description, $type]) {
        upsert($conn, "
            INSERT INTO systemova_nastaveni (klic, hodnota, popis, typ)
            VALUES (:keyValue, :valueText, :description, :typeValue)
            ON DUPLICATE KEY UPDATE
                hodnota = VALUES(hodnota),
                popis = VALUES(popis),
                typ = VALUES(typ)
        ", [
            ":keyValue" => $key,
            ":valueText" => $value,
            ":description" => $description,
            ":typeValue" => $type,
        ]);
    }

    $conn->commit();

    echo "OK - demo data byla nahrána. Přihlašovací heslo demo uživatelů: Chronis2026!" . PHP_EOL;
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
    exit(1);
}
