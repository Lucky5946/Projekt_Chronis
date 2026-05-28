-- Chronis - sjednocení propustek pod žádosti o absenci
-- Importujte nad existující databází chronisdb.

SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `zadosti_propustky`;

ALTER TABLE `zadosti_absence`
  ADD COLUMN `cas_od` time DEFAULT NULL AFTER `datum_do`,
  ADD COLUMN `cas_do` time DEFAULT NULL AFTER `cas_od`,
  ADD COLUMN `misto` varchar(120) DEFAULT NULL AFTER `cas_do`;

INSERT INTO `typy` (`id_typ`, `nazev`)
SELECT 5, 'Propustka'
WHERE NOT EXISTS (
  SELECT 1 FROM `typy` WHERE `nazev` = 'Propustka'
);

SET FOREIGN_KEY_CHECKS=1;
