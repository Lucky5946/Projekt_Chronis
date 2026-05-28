INSERT INTO `systemova_nastaveni` (`klic`, `hodnota`, `popis`, `typ`)
VALUES ('rocni_narok_dovolene', '25', 'Výchozí roční nárok dovolené ve dnech.', 'number')
ON DUPLICATE KEY UPDATE
  `hodnota` = VALUES(`hodnota`),
  `popis` = VALUES(`popis`),
  `typ` = VALUES(`typ`);
