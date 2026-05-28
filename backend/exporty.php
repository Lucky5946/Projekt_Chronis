<?php
session_start();

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "connection.php";
require_once "auth_helpers.php";

require_admin_or_manager();

function loadExportHistory(PDO $conn, bool $isAdmin, ?int $companyId): array
{
    $scopeSql = $isAdmin ? "" : "WHERE creator_company.id_firma = :companyId";
    $stmt = $conn->prepare("
        SELECT
            e.*,
            CONCAT(z.jmeno, ' ', z.prijmeni) AS vytvoril
        FROM exporty e
        LEFT JOIN zamestnanci z ON e.id_vytvoril = z.id_zamestnanec
        LEFT JOIN oddeleni creator_company ON z.id_oddeleni = creator_company.id_oddeleni
        $scopeSql
        ORDER BY e.vytvoreno DESC, e.id_export DESC
        LIMIT 20
    ");
    $stmt->execute($isAdmin ? [] : [":companyId" => $companyId ?: 0]);

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function exportTypeLabel(string $type): string
{
    return [
        "dochazka" => "Docházka",
        "absence" => "Absence",
        "mzdy" => "Mzdy",
        "uzivatele" => "Uživatelé",
        "firmy" => "Firmy",
    ][$type] ?? "Export";
}

function xmlEscapeValue($value): string
{
    return htmlspecialchars((string)($value ?? ""), ENT_QUOTES | ENT_XML1, "UTF-8");
}

function excelColumnName(int $index): string
{
    $name = "";
    while ($index > 0) {
        $index--;
        $name = chr(65 + ($index % 26)) . $name;
        $index = intdiv($index, 26);
    }

    return $name;
}

function excelCell(string $column, int $row, $value, int $style = 0): string
{
    $styleAttribute = $style > 0 ? ' s="' . $style . '"' : "";

    if (is_numeric($value) && !preg_match('/^0\d+/', (string)$value)) {
        return '<c r="' . $column . $row . '"' . $styleAttribute . '><v>' . xmlEscapeValue($value) . '</v></c>';
    }

    return '<c r="' . $column . $row . '" t="inlineStr"' . $styleAttribute . '><is><t>' . xmlEscapeValue($value) . '</t></is></c>';
}

function buildWorksheetXml(array $rows, string $title, string $from, string $to): string
{
    $headers = $rows[0] ?? [];
    $dataRows = array_slice($rows, 1);
    $columnCount = max(count($headers), 1);
    $lastColumn = excelColumnName($columnCount);
    $lastRow = count($dataRows) + 4;

    $cols = "";
    for ($i = 1; $i <= $columnCount; $i++) {
        $width = min(max(strlen((string)($headers[$i - 1] ?? "")) + 8, 16), 34);
        $cols .= '<col min="' . $i . '" max="' . $i . '" width="' . $width . '" customWidth="1"/>';
    }

    $sheetData = '<row r="1" ht="28" customHeight="1">' . excelCell("A", 1, $title, 2) . '</row>';
    $sheetData .= '<row r="2">' . excelCell("A", 2, "Období: " . $from . " - " . $to, 3) . '</row>';
    $sheetData .= '<row r="3"></row>';

    $headerCells = "";
    foreach ($headers as $index => $header) {
        $headerCells .= excelCell(excelColumnName($index + 1), 4, $header, 1);
    }
    $sheetData .= '<row r="4">' . $headerCells . '</row>';

    foreach ($dataRows as $rowIndex => $row) {
        $excelRow = $rowIndex + 5;
        $cells = "";
        for ($columnIndex = 0; $columnIndex < $columnCount; $columnIndex++) {
            $cells .= excelCell(excelColumnName($columnIndex + 1), $excelRow, $row[$columnIndex] ?? "", 0);
        }
        $sheetData .= '<row r="' . $excelRow . '">' . $cells . '</row>';
    }

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:' . $lastColumn . $lastRow . '"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>' . $cols . '</cols>
  <sheetData>' . $sheetData . '</sheetData>
  <autoFilter ref="A4:' . $lastColumn . $lastRow . '"/>
  <mergeCells count="2"><mergeCell ref="A1:' . $lastColumn . '1"/><mergeCell ref="A2:' . $lastColumn . '2"/></mergeCells>
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>';
}

function writeXlsx(string $path, array $rows, string $title, string $from, string $to): void
{
    $zip = new ZipArchive();
    if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new RuntimeException("Soubor XLSX se nepodařilo vytvořit.");
    }

    $zip->addFromString("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>');
    $zip->addFromString("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>');
    $zip->addFromString("xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Export" sheetId="1" r:id="rId1"/></sheets>
</workbook>');
    $zip->addFromString("xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>');
    $zip->addFromString("xl/styles.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="18"/><color rgb="FF111827"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F7A8C"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFE5E7EB"/></left><right style="thin"><color rgb="FFE5E7EB"/></right><top style="thin"><color rgb="FFE5E7EB"/></top><bottom style="thin"><color rgb="FFE5E7EB"/></bottom><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>');
    $zip->addFromString("xl/worksheets/sheet1.xml", buildWorksheetXml($rows, $title, $from, $to));
    $zip->close();
}

function buildCsvRows(PDO $conn, string $type, string $from, string $to, int $departmentId, bool $isAdmin, ?int $companyId): array
{
    $companySql = $isAdmin ? "" : "AND o.id_firma = :companyId";
    $departmentSql = $departmentId > 0 ? "AND z.id_oddeleni = :departmentId" : "";
    $scopeParams = $isAdmin ? [] : [":companyId" => $companyId ?: 0];

    if ($type === "absence") {
        $stmt = $conn->prepare("
            SELECT
                CONCAT(z.jmeno, ' ', z.prijmeni) AS zamestnanec,
                t.nazev AS typ,
                a.datum_od,
                a.datum_do,
                a.stav,
                a.poznamka
            FROM zadosti_absence a
            JOIN zamestnanci z ON a.id_zamestnanec = z.id_zamestnanec
            JOIN typy t ON a.id_typ = t.id_typ
            LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
            WHERE a.datum_od <= :toDate
                AND a.datum_do >= :fromDate
                $departmentSql
                $companySql
            ORDER BY a.datum_od ASC
        ");
        $params = array_merge([":fromDate" => $from, ":toDate" => $to], $scopeParams);
        if ($departmentId > 0) {
            $params[":departmentId"] = $departmentId;
        }
        $stmt->execute($params);

        return array_merge([["Zaměstnanec", "Typ", "Od", "Do", "Stav", "Poznámka"]], $stmt->fetchAll(PDO::FETCH_NUM));
    }

    $stmt = $conn->prepare("
        SELECT
            CONCAT(z.jmeno, ' ', z.prijmeni) AS zamestnanec,
            o.nazev AS oddeleni,
            d.datum,
            d.prichod,
            d.odchod,
            d.pauza_minut,
            d.mimo_pracoviste_minut,
            d.odpracovano_minut,
            COALESCE(plan_smena.nazev, vychozi_smena.nazev, 'Výchozí směna') AS smena,
            COALESCE(plan_smena.uvazek_minut, vychozi_smena.uvazek_minut, 480) AS plan_minut,
            GREATEST(d.odpracovano_minut - COALESCE(plan_smena.uvazek_minut, vychozi_smena.uvazek_minut, 480), 0) AS prescas_minut,
            d.stav
        FROM dochazka_dny d
        JOIN zamestnanci z ON d.id_zamestnanec = z.id_zamestnanec
        LEFT JOIN oddeleni o ON z.id_oddeleni = o.id_oddeleni
        LEFT JOIN smeny vychozi_smena ON z.id_vychozi_smena = vychozi_smena.id_smena
        LEFT JOIN plan_smen ps ON ps.id_zamestnanec = z.id_zamestnanec AND ps.datum = d.datum
        LEFT JOIN smeny plan_smena ON ps.id_smena = plan_smena.id_smena
        WHERE d.datum BETWEEN :fromDate AND :toDate
            $departmentSql
            $companySql
        ORDER BY d.datum ASC, z.prijmeni ASC
    ");
    $params = array_merge([":fromDate" => $from, ":toDate" => $to], $scopeParams);
    if ($departmentId > 0) {
        $params[":departmentId"] = $departmentId;
    }
    $stmt->execute($params);

    return array_merge([["Zaměstnanec", "Oddělení", "Datum", "Příchod", "Odchod", "Pauza minut", "Mimo pracoviště minut", "Odpracováno minut", "Směna", "Plán minut", "Přesčas minut", "Stav"]], $stmt->fetchAll(PDO::FETCH_NUM));
}

$isAdmin = current_user_is_admin();
$companyId = current_user_company_id($conn);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $deptStmt = $conn->prepare("
            SELECT id_oddeleni, nazev
            FROM oddeleni
            " . ($isAdmin ? "" : "WHERE id_firma = :companyId") . "
            ORDER BY nazev ASC
        ");
        $deptStmt->execute($isAdmin ? [] : [":companyId" => $companyId ?: 0]);

        echo json_encode([
            "success" => true,
            "exports" => loadExportHistory($conn, $isAdmin, $companyId),
            "departments" => $deptStmt->fetchAll(PDO::FETCH_ASSOC),
            "scope" => $isAdmin ? "all" : "company",
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
    }
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$type = $data['type'] ?? "dochazka";
$format = strtolower($data['format'] ?? "csv");
$from = $data['from'] ?? date("Y-m-01");
$to = $data['to'] ?? date("Y-m-t");
$departmentId = (int)($data['departmentId'] ?? 0);

$allowedTypes = $isAdmin ? ["dochazka", "absence", "mzdy", "uzivatele", "firmy"] : ["dochazka", "absence", "mzdy"];
if (!in_array($type, $allowedTypes, true) || !in_array($format, ["csv", "xlsx"], true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Neplatný typ nebo formát exportu."]);
    exit();
}

if ($departmentId > 0 && !department_belongs_to_manager_company($conn, $departmentId)) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "K tomuto oddělení nemáte přístup."]);
    exit();
}

try {
    $rows = buildCsvRows($conn, $type, $from, $to, $departmentId, $isAdmin, $companyId);
    $exportDir = __DIR__ . DIRECTORY_SEPARATOR . "exports";
    if (!is_dir($exportDir)) {
        mkdir($exportDir, 0775, true);
    }

    $extension = $format === "xlsx" ? "xlsx" : "csv";
    $safeName = exportTypeLabel($type) . "_" . str_replace("-", "", $from) . "_" . str_replace("-", "", $to) . "_" . date("His") . "." . $extension;
    $path = $exportDir . DIRECTORY_SEPARATOR . $safeName;

    if ($format === "xlsx") {
        writeXlsx($path, $rows, exportTypeLabel($type), $from, $to);
    } else {
        $handle = fopen($path, "w");
        fwrite($handle, "\xEF\xBB\xBF");
        foreach ($rows as $row) {
            fputcsv($handle, $row, ";");
        }
        fclose($handle);
    }

    $relativePath = "exports/" . $safeName;
    $stmt = $conn->prepare("
        INSERT INTO exporty (typ, format, nazev_souboru, cesta_souboru, obdobi_od, obdobi_do, stav, id_vytvoril)
        VALUES (:typ, :format, :nazev, :cesta, :od, :do, 'hotovo', :userId)
    ");
    $stmt->execute([
        ":typ" => $type,
        ":format" => $format,
        ":nazev" => $safeName,
        ":cesta" => $relativePath,
        ":od" => $from,
        ":do" => $to,
        ":userId" => current_user_id(),
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Export byl vygenerován.",
        "exports" => loadExportHistory($conn, $isAdmin, $companyId),
        "fileUrl" => "http://localhost/api/" . $relativePath,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Chyba serveru: " . $e->getMessage()]);
} catch (RuntimeException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
