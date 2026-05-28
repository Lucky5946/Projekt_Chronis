ALTER TABLE `firmy`
  ADD COLUMN `dovolena_dni` int NOT NULL DEFAULT 25 AFTER `logo_cesta`;

UPDATE `firmy`
SET `dovolena_dni` = 25
WHERE `dovolena_dni` IS NULL OR `dovolena_dni` = 0;
