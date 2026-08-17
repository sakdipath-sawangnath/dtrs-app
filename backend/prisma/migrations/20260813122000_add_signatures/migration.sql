-- AlterTable User: ลายเซ็นเจ้าหน้าที่
ALTER TABLE `User` ADD COLUMN `signature` VARCHAR(191) NULL;

-- AlterTable Job: ลายเซ็นผู้แจ้งตอนปิดงาน
ALTER TABLE `Job` ADD COLUMN `reporterSignature` VARCHAR(191) NULL;
ALTER TABLE `Job` ADD COLUMN `reporterSignedAt` DATETIME(3) NULL;
