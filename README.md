# Chronis - docházkový systém pro firmy

**Chronis** je webový docházkový systém pro evidenci pracovní doby, absencí a základní správu firemních dat.

Projekt vzniká jako školní projekt se zaměřením na moderní frontend v Reactu a jednoduchý PHP backend s databází MySQL.

## Hlavní funkce

- evidence příchodu a odchodu
- žádosti o absenci
- schvalování absencí pro administrátora
- správa firem
- uživatelské role
- responzivní administrační rozhraní

## Dokumentace projektu

Povinná projektová dokumentace je uložená ve složce `docs/`:

- `docs/SRS.md` - Software Requirements Specification
- `docs/SDD.md` - Software Design Document
- `docs/export/SRS.html` a `docs/export/SRS.pdf` - exportovaná verze SRS
- `docs/export/SDD.html` a `docs/export/SDD.pdf` - exportovaná verze SDD

Export dokumentace lze znovu vygenerovat příkazem:

```bash
node scripts/build-docs.js
```

## Použité technologie

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Lucide React

### Backend

- PHP
- MySQL
- REST API endpointy

## Instalace frontendu

```bash
cd frontend
npm install
npm run dev
```

## Ověření frontendu

```bash
cd frontend
npm run build
npm run test -- --run
```

## Struktura frontendu

Struktura aplikace je popsaná v souboru:

```text
frontend/src/ARCHITECTURE.md
```

## Backend

Backend endpointy jsou ve složce:

```text
backend/
```

Pro lokální běh je potřeba mít připravenou databázi `chronisdb` a správně nastavené připojení v `backend/connection.php`.
