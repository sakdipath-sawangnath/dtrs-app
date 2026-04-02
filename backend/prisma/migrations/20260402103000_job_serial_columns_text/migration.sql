-- รองรับ JSON หลายแถว (ชื่ออุปกรณ์ + S/N) — VARCHAR(191) ไม่พอ
ALTER TABLE `Job` MODIFY `oldSerialNumber` TEXT NULL;
ALTER TABLE `Job` MODIFY `newSerialNumber` TEXT NULL;
