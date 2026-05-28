# Backend Architecture

Backend postupně přechází z jedné složky PHP endpointů na jednodušší vrstvenou strukturu.

## Složky

- `*.php` v kořeni `backend/` jsou veřejné endpointy, které volá frontend přes `http://localhost/api/...`.
- `src/Support` obsahuje společné API funkce: CORS, session, JSON odpovědi a načtení databáze.
- `src/Repositories` obsahuje SQL dotazy a práci s databází.
- `src/Services` obsahuje aplikační logiku a validace.
- `sql/` obsahuje migrační nebo doplňkové SQL skripty.

## Pravidlo pro nové části

Nový endpoint by měl být jen krátký soubor v kořeni `backend/`, který:

1. načte `src/Support/api.php`,
2. načte potřebný repository a service,
3. předá request do service,
4. vrátí JSON odpověď.

Logika, validace a SQL by neměly růst přímo v endpointu.
