# SRS - Software Requirements Specification

## 1. Identifikace dokumentu

**Název projektu:** Chronis  
**Typ systému:** Webová docházková a administrační aplikace  
**Autor projektu:** Lukáš Mareš  
**Verze dokumentu:** 1.0  
**Datum:** 28. 5. 2026

## 2. Účel dokumentu

Tento dokument popisuje softwarové požadavky aplikace Chronis. Slouží jako specifikace toho, co má aplikace poskytovat z pohledu uživatelů, administrátorů a vedoucích pracovníků. Dokument definuje účel systému, cílové uživatele, hlavní funkce, nefunkční požadavky, datové požadavky, omezení a akceptační kritéria.

## 3. Účel aplikace

Chronis je webová aplikace pro evidenci docházky zaměstnanců, správu firem, uživatelů, absencí, reportů, recenzí a interní komunikace. Systém je určen pro firmy, které chtějí nahradit papírovou nebo tabulkovou evidenci docházky přehlednou online aplikací.

Aplikace umožňuje zaměstnancům zaznamenat příchod, odchod, pauzu a krátkodobý odchod mimo pracoviště. Vedoucí pracovníci mohou spravovat své zaměstnance, sledovat docházku a schvalovat žádosti. Administrátor má plnou správu systému včetně firem, uživatelů, nastavení, reportů a exportů.

## 4. Rozsah systému

Součástí systému jsou:

- veřejná prezentační část aplikace,
- přihlášení a autentizace uživatelů,
- role administrátor, vedoucí směny a zaměstnanec,
- zaměstnanecký dashboard,
- administrátorský dashboard,
- dashboard vedoucího,
- evidence docházky,
- historie docházky,
- správa žádostí o absenci,
- schvalování absencí,
- správa firem,
- správa uživatelů,
- přiřazení výchozí směny uživateli,
- reporty docházky,
- exporty do CSV a XLSX,
- systém zpráv a notifikací,
- nastavení systému,
- nápověda,
- reset a nastavení hesla přes emailový odkaz,
- fotografie zaměstnanců,
- chybové stránky pro neexistující stránku a nedostatečný přístup.

## 5. Cíloví uživatelé

### 5.1 Nepřihlášený návštěvník

Nepřihlášený uživatel může zobrazit veřejnou část aplikace, například hlavní stránku, stránku O nás, kontakty a přihlašovací stránku.

### 5.2 Zaměstnanec

Zaměstnanec může:

- zobrazit svůj dashboard,
- evidovat vlastní docházku,
- vytvořit žádost o absenci,
- sledovat svoje žádosti,
- zobrazit historii docházky,
- používat zprávy,
- zobrazit nápovědu.

### 5.3 Vedoucí směny

Vedoucí směny má rozšířený přístup nad zaměstnanci své firmy. Může:

- spravovat uživatele ve své firmě,
- schvalovat nebo zamítat žádosti o absenci,
- zobrazit docházkové reporty,
- exportovat vybraná data,
- pracovat se zprávami,
- používat vlastní docházku stejně jako běžný zaměstnanec.

Vedoucí nemá přístup ke správě všech firem ani ke globálnímu nastavení systému.

### 5.4 Administrátor

Administrátor má plný přístup k systému. Může:

- spravovat firmy,
- spravovat všechny uživatele,
- nastavovat roční nárok dovolené pro firmy,
- spravovat role a oddělení přes uživatelskou správu,
- schvalovat absence,
- zobrazovat reporty,
- vytvářet exporty,
- měnit systémová nastavení,
- používat zprávy a nápovědu.

## 6. Funkční požadavky

### FR-01 Veřejná část aplikace

Systém musí poskytovat veřejnou hlavní stránku aplikace.

Veřejná část musí obsahovat:

- informace o aplikaci,
- stránku O nás,
- stránku Kontakty,
- kontaktní formulář,
- mapu umístění firmy,
- členy týmu s kontakty,
- tlačítko pro přechod na přihlášení.

### FR-02 Přihlášení uživatele

Systém musí umožnit přihlášení pomocí přihlašovacího jména a hesla.

Po úspěšném přihlášení musí systém:

- vytvořit session,
- uložit identitu uživatele,
- rozpoznat roli uživatele,
- přesměrovat uživatele do interní části aplikace.

Při neplatných údajích musí systém zobrazit chybovou zprávu.

### FR-03 Ochrana interních stránek

Systém musí chránit interní stránky před nepřihlášenými uživateli.

Pokud uživatel není přihlášený, musí být přesměrován na přihlášení.

Pokud uživatel nemá oprávnění k dané stránce, systém musí zobrazit stránku s informací, že nemá přístup.

Pokud uživatel zadá neexistující URL, systém musí zobrazit stránku „Tato stránka neexistuje“.

### FR-04 Role a oprávnění

Systém musí rozlišovat role:

- administrátor,
- vedoucí směny,
- zaměstnanec.

Systém musí podle role zobrazovat rozdílný sidebar, dashboard a povolené stránky.

### FR-05 Dashboard zaměstnance

Zaměstnanec musí mít dashboard s přehledem:

- dnešního stavu docházky,
- odpracovaného času za dnešní den,
- počtu vlastních žádostí,
- času odpracovaného v aktuálním měsíci,
- dnešní směny,
- rychlých akcí.

### FR-06 Dashboard vedoucího

Vedoucí směny musí mít dashboard týmu.

Dashboard musí zobrazit:

- počet spravovaných uživatelů,
- počet čekajících žádostí,
- počet vyřešených žádostí,
- rychlé odkazy na správu uživatelů, schvalování absencí a vlastní docházku.

### FR-07 Dashboard administrátora

Administrátor musí mít dashboard s přehledem systému.

Dashboard musí zobrazit:

- počet firem,
- aktivního uživatele,
- roli uživatele,
- rychlé akce,
- poslední firmy.

### FR-08 Evidence docházky

Zaměstnanec musí mít možnost zaznamenat:

- příchod,
- zahájení pauzy,
- ukončení pauzy,
- odchod mimo pracoviště,
- návrat na pracoviště,
- ukončení směny.

Systém musí bránit neplatným posloupnostem akcí, například:

- nelze ukončit směnu bez příchodu,
- nelze ukončit pauzu, pokud pauza nezačala,
- nelze ukončit směnu během pauzy,
- nelze ukončit směnu během stavu mimo pracoviště,
- nelze znovu zadat příchod v již otevřeném dni.

### FR-09 Pauza a odchod mimo pracoviště

Systém musí odpracovaný čas počítat jako rozdíl mezi příchodem a finálním odchodem snížený o:

- dobu pauzy,
- dobu mimo pracoviště.

Odchod mimo pracoviště nesmí uzavřít pracovní den.

### FR-10 Směny

Systém musí umožnit evidenci směn.

Každý zaměstnanec musí mít přiřazenou výchozí směnu.

Směna musí obsahovat:

- název,
- čas začátku,
- čas konce,
- toleranci pro pozdní příchod,
- plánovaný počet minut.

Systém musí podporovat ranní, odpolední, noční a zkrácené směny.

Pozdní příchod se musí vyhodnocovat podle začátku směny a tolerance.

### FR-11 Historie docházky

Zaměstnanec musí mít možnost zobrazit historii docházky.

Historie musí obsahovat:

- kalendář nebo měsíční přehled,
- příchod,
- odchod,
- pauzu,
- čas mimo pracoviště,
- odpracovaný čas,
- stav dne,
- souhrn za období.

### FR-12 Žádost o absenci

Zaměstnanec musí mít možnost vytvořit žádost o absenci.

Žádost musí obsahovat:

- typ absence,
- datum od,
- datum do,
- volitelně čas od,
- volitelně čas do,
- poznámku.

Systém musí kontrolovat:

- povinná pole,
- správné pořadí datumů,
- správné pořadí časů,
- překryv s existující absencí,
- maximální roční nárok dovolené podle firmy.

### FR-13 Moje žádosti

Zaměstnanec musí mít přehled svých žádostí.

Přehled musí obsahovat:

- stav žádosti,
- typ,
- termín,
- počet dnů,
- poznámku,
- informaci o schválení nebo zamítnutí.

### FR-14 Schvalování absencí

Administrátor a vedoucí musí mít možnost schvalovat nebo zamítat žádosti.

Stránka schvalování musí obsahovat:

- kalendář absencí,
- přehled požadavků,
- detail žádosti,
- poznámku,
- tlačítko schválit,
- tlačítko zamítnout.

Vedoucí směny smí pracovat pouze s žádostmi zaměstnanců své firmy.

### FR-15 Správa firem

Administrátor musí mít možnost spravovat firmy.

U firmy se eviduje:

- název,
- IČO,
- email,
- telefon,
- adresa,
- logo,
- roční nárok dovolené.

Roční nárok dovolené musí být nastavitelný individuálně pro každou firmu v rozsahu 20 až 40 dnů.

### FR-16 Správa uživatelů

Administrátor a vedoucí musí mít možnost spravovat uživatele.

Uživatel musí obsahovat:

- jméno,
- příjmení,
- email,
- telefon,
- fotografii,
- čip,
- mzdu,
- datum nástupu,
- roli,
- oddělení,
- výchozí směnu,
- přihlašovací jméno,
- aktivní/neaktivní stav.

Vedoucí směny nesmí vytvářet ani upravovat administrátory.

Vedoucí směny smí pracovat pouze s uživateli své firmy.

### FR-17 Fotografie zaměstnanců

Systém musí umožnit nahrát fotografii zaměstnance.

Fotografie musí být uložena v souborovém systému a cesta musí být uložena v databázi.

Pokud zaměstnanec nemá fotografii, systém musí zobrazit iniciály zaměstnance.

### FR-18 Nastavení hesla přes email

Při vytvoření uživatele musí systém umožnit zaslat email s odkazem na nastavení hesla.

Odkaz musí:

- obsahovat jednorázový token,
- být časově omezený,
- být po použití zneplatněn.

Heslo nesmí být posíláno emailem v čitelné podobě.

### FR-19 Zprávy a notifikace

Systém musí obsahovat stránku zpráv.

Zprávy musí podporovat:

- systémové notifikace,
- interní zprávy,
- výběr příjemce,
- odpověď na zprávu,
- potvrzení odeslání.

### FR-20 Reporty

Administrátor a vedoucí musí mít možnost zobrazit docházkové reporty.

Reporty musí obsahovat:

- filtr období,
- filtr firmy pro administrátora,
- filtr oddělení pro vedoucího,
- souhrn odpracovaných hodin,
- počet absencí,
- počet pozdních příchodů,
- přesčasy,
- přehled podle zaměstnanců,
- přehled podle oddělení,
- týdenní graf.

### FR-21 Exporty

Systém musí umožnit export dat.

Podporované formáty:

- CSV,
- XLSX.

Exporty musí podporovat:

- docházku,
- absence,
- mzdy,
- uživatele,
- firmy.

Vedoucí směny smí exportovat pouze data své firmy.

### FR-22 Nastavení systému

Administrátor musí mít přístup k nastavení systému.

Nastavení musí obsahovat:

- název systému,
- hlavní email,
- záložní začátek směny,
- záložní konec směny,
- notifikační volby.

### FR-23 Nápověda

Systém musí obsahovat stránku nápovědy.

Nápověda musí být dostupná všem přihlášeným uživatelům.

### FR-24 Recenze

Systém musí umožnit přihlášeným uživatelům odeslat recenzi.

Recenze musí obsahovat:

- text recenze,
- hvězdičkové hodnocení,
- autora,
- datum vytvoření,
- stav schválení.

Zaměstnanec a vedoucí musí vidět své vlastní recenze.

Administrátor musí mít možnost zobrazit všechny recenze a změnit jejich stav na schváleno nebo zamítnuto.

Veřejná část aplikace smí zobrazovat pouze schválené recenze.

### FR-25 Kontaktní formulář

Veřejná kontaktní část musí umožnit odeslat zprávu přes email.

Formulář musí obsahovat:

- jméno,
- firmu,
- email,
- zprávu.

## 7. Nefunkční požadavky

### NFR-01 Použitelnost

Aplikace musí být přehledná, jednoduchá a použitelná pro běžného zaměstnance bez technických znalostí.

### NFR-02 Responzivita

Aplikace musí být použitelná na počítači a notebooku. Vybrané obrazovky musí být rozumně použitelné i na menších šířkách.

### NFR-03 Bezpečnost

Systém musí:

- ukládat hesla pouze jako hash,
- ověřovat session u chráněných endpointů,
- kontrolovat oprávnění podle role,
- neumožnit vedoucímu přístup k cizím firmám,
- používat jednorázové tokeny pro nastavení hesla.

### NFR-04 Integrita dat

Systém musí kontrolovat vstupy na frontendu i backendu.

Backend musí validovat:

- povinná pole,
- platnost datumů,
- platnost rolí,
- rozsah dovolené,
- existenci směny,
- oprávnění nad oddělením a firmou.

### NFR-05 Výkon

Běžné stránky aplikace musí načítat data přes JSON endpointy a zobrazit přehledy bez zbytečného prodlení.

### NFR-06 Udržovatelnost

Kód musí být rozdělen alespoň na:

- frontend stránky,
- sdílené komponenty,
- layouty,
- backend endpointy,
- pomocné backend funkce,
- databázové migrace.

Novější části backendu mají být přesouvány do jednodušší vrstvené struktury `src/Support`, `src/Repositories` a `src/Services`.

### NFR-07 Kompatibilita

Aplikace je určena pro běh v lokálním vývojovém prostředí:

- frontend přes Vite,
- backend přes WAMP/PHP,
- databáze MySQL.

### NFR-08 Dostupnost

V lokálním školním prostředí se předpokládá dostupnost během prezentace projektu. Produkční vysoká dostupnost není součástí aktuálního rozsahu.

### NFR-09 Zálohování

Zálohování databáze není v aktuální implementaci automatizované. Pro odevzdání projektu se předpokládá přiložení databázového SQL exportu nebo migračních skriptů.

### NFR-10 Lokalizace

Uživatelské rozhraní je v českém jazyce.

## 8. Datové požadavky

Systém pracuje hlavně s těmito entitami:

- zaměstnanec,
- firma,
- oddělení,
- pozice,
- adresa,
- pošta,
- docházkový den,
- docházková událost,
- typ absence,
- žádost o absenci,
- směna,
- plán směn,
- systémové nastavení,
- zpráva,
- export,
- token pro nastavení hesla.

## 9. Externí rozhraní

### 9.1 Uživatelské rozhraní

Frontend je webová aplikace vytvořená v Reactu.

### 9.2 Backend API

Frontend komunikuje s backendem přes HTTP endpointy v PHP. Data se předávají ve formátu JSON.

### 9.3 Emailové rozhraní

Systém používá PHPMailer a SMTP server Seznamu pro:

- kontaktní formulář,
- zaslání odkazu pro nastavení hesla.

## 10. Omezení

- Aplikace je primárně určena pro školní projekt a lokální běh.
- Backend je řešen pomocí PHP endpointů bez plnohodnotného frameworku.
- Některé části jsou připravené pro další rozšiřování, například detailní plánování směn.
- Produkční provoz by vyžadoval další bezpečnostní úpravy, HTTPS, lepší konfiguraci prostředí a automatické zálohy.

## 11. Akceptační kritéria

Projekt lze považovat za splněný, pokud:

- uživatel se může přihlásit,
- role ovlivňuje přístup ke stránkám,
- zaměstnanec může evidovat docházku,
- zaměstnanec může podat žádost o absenci,
- administrátor nebo vedoucí může žádost schválit nebo zamítnout,
- administrátor může spravovat firmy,
- administrátor nebo vedoucí může spravovat uživatele,
- systém umí zobrazit historii docházky,
- systém umí zobrazit reporty,
- systém umí vytvořit export CSV/XLSX,
- systém umí poslat nebo zobrazit odkaz pro nastavení hesla,
- aplikace obsahuje nápovědu a chybové stránky,
- zdrojové kódy a dokumentace jsou dostupné v repozitáři.
