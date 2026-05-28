ALTER TABLE dochazka_dny
  ADD COLUMN mimo_pracoviste_minut INT NOT NULL DEFAULT 0 AFTER pauza_minut;
