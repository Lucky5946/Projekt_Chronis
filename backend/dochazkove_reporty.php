<?php
session_start();

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "connection.php";
require_once "auth_helpers.php";

require_admin_or_manager();

$from = $_GET['from'] ?? date("Y-m-01");
$to = $_GET['to'] ?? date("Y-m-t");
$filterCompanyId = (int)($_GET['companyId'] ?? 0);
$departmentId = (int)($_GET['departmentId'] ?? 0);
$search = trim($_GET['search'] ?? "");

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Neplatné období."]);
    exit();
}

try {
    $isAdmin = current_user_is_admin();
    $companyId = current_user_company_id($conn);
    $activeCompanyId = $isAdmin ? $filterCompanyId : ($companyId ?: 0);
    $companies = $isAdmin
        ? $conn->query("SELECT id_firma, nazev FROM firmy ORDER BY nazev ASC")->fetchAll(PDO::FETCH_ASSOC)
        : [];

    if ($isAdmin && $departmentId > 0) {
        $departmentId = 0;
    }

    if (!$isAdmin && $departmentId > 0 && !department_belongs_to_manager_company($conn, $departmentId)) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "K tomuto oddělení nemáte přístup."]);
        exit();
    }

    $deptStmt = $conn->prepare("
        SELECT id_oddeleni, nazev
        FROM oddeleni
        " . ($isAdmin ? "" : "WHERE id_firma = :companyId") . "
        ORDER BY nazev ASC
    ");
    $deptStmt->execute($isAdmin ? [] : [":companyId" => $companyId ?: 0]);
    $departments = $deptStmt->fetchAll(PDO::FETCH_ASSOC);

    $where = "WHERE z.aktivni = 1";
    $params = [
        ":fromDate" => $from,
        ":toDate" => $to,
    ];

    if ($activeCompanyId > 0) {
        $where .= " AND o.id_firma = :companyId";
        $params[":companyId"] = $activeCompanyId;
    }

    if ($departmentId > 0) {
        $where .= " AND z.id_oddeleni = :departmentId";
        $params[":departmentId"] = $departmentId;
    }

    if ($search !== "") {
        $where .= " AND (z.jmeno LIKE :search OR z.prijmeni LIKE :search OR z.email LIKE :search)";
        $params[":search"] = "%" . $search . "%";
    }

    $employeeStmt = $conn->prepare("
        SELECT
            z.id_zamestnanec,
            CONCAT(z.jmeno, ' ', z.prijmeni) AS jmeno,
            o.nazev AS oddeleni,
            COUNT(d.id_dochazka_den) AS zaznamy,
            COALESCE(SUM(d.odpracovano_minut), 0) AS minuty,
            COALESCE(SUM(CASE WHEN d.stav = 'absence' THEN 1 ELSE 0 END), 0) AS absence,
            COALESCE(SUM(CASE WHEN d.stav = 'pozdni_prichod' THEN 1 ELSE 0 END), 0) AS pozdni,
            COALESCE(SUM(CASE WHEN d.stav = 'neuzavreno' THEN 1 ELSE 0 END), 0) AS neuzavreno,
            COALESCE(SUM(GREATEST(d.odpracovano_minut - COALESCE(plan_smena.uvazek_minut, vychozi_smena.uvazek_minut, 480), 0)), 0) AS prescas,
            AVG(CASE WHEN d.prichod IS NOT NULL THEN TIME_TO_SEC(d.prichod) END) AS prumer_prichod
        FROM zamestnanci z
        LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
        LEFT JOIN smeny vychozi_smena ON z.id_vychozi_smena = vychozi_smena.id_smena
        LEFT JOIN dochazka_dny d
            ON z.id_zamestnanec = d.id_zamestnanec
            AND d.datum BETWEEN :fromDate AND :toDate
        LEFT JOIN plan_smen ps ON ps.id_zamestnanec = z.id_zamestnanec AND ps.datum = d.datum
        LEFT JOIN smeny plan_smena ON ps.id_smena = plan_smena.id_smena
        $where
        GROUP BY z.id_zamestnanec, z.jmeno, z.prijmeni, o.nazev
        ORDER BY z.prijmeni ASC, z.jmeno ASC
    ");
    $employeeStmt->execute($params);
    $employees = $employeeStmt->fetchAll(PDO::FETCH_ASSOC);

    $departmentWhere = [];
    $departmentParams = [
        ":fromDate" => $from,
        ":toDate" => $to,
    ];

    if ($activeCompanyId > 0) {
        $departmentWhere[] = "o.id_firma = :companyId";
        $departmentParams[":companyId"] = $activeCompanyId;
    }

    if ($departmentId > 0) {
        $departmentWhere[] = "o.id_oddeleni = :departmentId";
        $departmentParams[":departmentId"] = $departmentId;
    }

    $departmentWhereSql = count($departmentWhere) > 0 ? "WHERE " . implode(" AND ", $departmentWhere) : "";
    $departmentStmt = $conn->prepare("
        SELECT
            o.id_oddeleni,
            o.nazev AS oddeleni,
            COUNT(DISTINCT z.id_zamestnanec) AS lide,
            COALESCE(SUM(d.odpracovano_minut), 0) AS minuty,
            COALESCE(SUM(CASE WHEN d.stav = 'absence' THEN 1 ELSE 0 END), 0) AS absence,
            COALESCE(SUM(GREATEST(d.odpracovano_minut - COALESCE(plan_smena.uvazek_minut, vychozi_smena.uvazek_minut, 480), 0)), 0) AS prescas
        FROM oddeleni o
        LEFT JOIN zamestnanci z ON o.id_oddeleni = z.id_oddeleni AND z.aktivni = 1
        LEFT JOIN smeny vychozi_smena ON z.id_vychozi_smena = vychozi_smena.id_smena
        LEFT JOIN dochazka_dny d
            ON z.id_zamestnanec = d.id_zamestnanec
            AND d.datum BETWEEN :fromDate AND :toDate
        LEFT JOIN plan_smen ps ON ps.id_zamestnanec = z.id_zamestnanec AND ps.datum = d.datum
        LEFT JOIN smeny plan_smena ON ps.id_smena = plan_smena.id_smena
        $departmentWhereSql
        GROUP BY o.id_oddeleni, o.nazev
        ORDER BY o.nazev ASC
    ");
    $departmentStmt->execute($departmentParams);
    $departmentRows = $departmentStmt->fetchAll(PDO::FETCH_ASSOC);

    $weeklySql = $activeCompanyId > 0 ? "AND o.id_firma = :companyId" : "";
    $weeklyDepartmentSql = $departmentId > 0 ? "AND z.id_oddeleni = :departmentId" : "";
    $weeklyStmt = $conn->prepare("
        SELECT
            WEEKDAY(d.datum) AS den,
            COALESCE(SUM(d.odpracovano_minut), 0) AS minuty
        FROM dochazka_dny d
        JOIN zamestnanci z ON d.id_zamestnanec = z.id_zamestnanec
        LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
        WHERE d.datum BETWEEN :fromDate AND :toDate
            $weeklyDepartmentSql
            $weeklySql
        GROUP BY WEEKDAY(d.datum)
    ");
    $weeklyParams = [
        ":fromDate" => $from,
        ":toDate" => $to,
    ];
    if ($activeCompanyId > 0) {
        $weeklyParams[":companyId"] = $activeCompanyId;
    }
    if ($departmentId > 0) {
        $weeklyParams[":departmentId"] = $departmentId;
    }
    $weeklyStmt->execute($weeklyParams);

    $weeklyMap = [];
    foreach ($weeklyStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $weeklyMap[(int)$row['den']] = (int)$row['minuty'];
    }

    $totalMinutes = array_sum(array_map(fn($row) => (int)$row['minuty'], $employees));
    $totalAbsence = array_sum(array_map(fn($row) => (int)$row['absence'], $employees));
    $totalOvertime = array_sum(array_map(fn($row) => (int)$row['prescas'], $employees));
    $arrivalValues = array_values(array_filter(array_map(fn($row) => $row['prumer_prichod'] !== null ? (float)$row['prumer_prichod'] : null, $employees)));
    $averageArrival = count($arrivalValues) > 0 ? array_sum($arrivalValues) / count($arrivalValues) : null;

    echo json_encode([
        "success" => true,
        "filters" => [
            "from" => $from,
            "to" => $to,
            "companyId" => $activeCompanyId,
            "departmentId" => $departmentId,
            "search" => $search,
        ],
        "departments" => $departments,
        "companies" => $companies,
        "scope" => $isAdmin ? "all" : "company",
        "summary" => [
            "totalMinutes" => $totalMinutes,
            "averageArrivalSeconds" => $averageArrival,
            "absenceDays" => $totalAbsence,
            "overtimeMinutes" => $totalOvertime,
            "employeeCount" => count($employees),
        ],
        "weekly" => array_map(function ($index) use ($weeklyMap) {
            return [
                "day" => $index,
                "minutes" => $weeklyMap[$index] ?? 0,
            ];
        }, range(0, 6)),
        "departmentRows" => $departmentRows,
        "employeeRows" => $employees,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
}
