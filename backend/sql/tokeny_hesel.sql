CREATE TABLE IF NOT EXISTS tokeny_hesel (
  id_token INT NOT NULL AUTO_INCREMENT,
  id_zamestnanec INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  platnost_do DATETIME NOT NULL,
  pouzito TINYINT(1) NOT NULL DEFAULT 0,
  vytvoreno DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pouzito_dne DATETIME NULL,
  PRIMARY KEY (id_token),
  UNIQUE KEY tokeny_hesel_hash_uq (token_hash),
  KEY tokeny_hesel_zamestnanec_fk (id_zamestnanec),
  CONSTRAINT tokeny_hesel_zamestnanec_fk
    FOREIGN KEY (id_zamestnanec) REFERENCES zamestnanci(id_zamestnanec)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
