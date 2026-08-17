-- Site.station + Job.agency (agency = สถานที่/หน่วยงาน, station = ชื่อสถานี)

ALTER TABLE `Site` ADD COLUMN `station` VARCHAR(191) NULL;

UPDATE `Site` SET `station` = `agency` WHERE `station` IS NULL OR `station` = '';

ALTER TABLE `Site` MODIFY `station` VARCHAR(191) NOT NULL;

ALTER TABLE `Job` ADD COLUMN `agency` VARCHAR(191) NULL;
