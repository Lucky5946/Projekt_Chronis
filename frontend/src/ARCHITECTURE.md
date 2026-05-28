# Frontend Architecture

Tahle složka je rozdělená podle odpovědnosti, aby se aplikace dala rozšiřovat bez toho, aby všechny soubory končily v jedné hromadě.

## `app/`

Obsahuje aplikační wiring. Teď je zde hlavně `AppRoutes.jsx`, kde jsou všechny routy aplikace.

## `layouts/`

Sdílené rozložení stránek. `SystemLayout.jsx` obaluje interní systémové stránky sidebar navigací a hlavním obsahem.

## `components/`

Znovupoužitelné komponenty.

- `components/system/` obsahuje komponenty pro interní systém, například jednotný `PageHeader`.
- ostatní komponenty zatím patří hlavně k veřejné landing page.

## `pages/`

Koncové obrazovky aplikace. Stránka může skládat layout, komponenty, lokální stav a volání API.

## `data/`

Dočasná mock data pro designové obrazovky. Jakmile bude hotový backend, data se přesunou do API volání.

## `utils/`

Čisté pomocné funkce bez Reactu, například práce s kalendářem.

## `assets/`

Obrázky, loga a statické vizuální soubory.
