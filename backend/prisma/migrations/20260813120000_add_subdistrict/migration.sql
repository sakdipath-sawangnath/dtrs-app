-- CreateTable Subdistrict
CREATE TABLE `Subdistrict` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `districtId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Subdistrict_districtId_name_key`(`districtId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Subdistrict` ADD CONSTRAINT `Subdistrict_districtId_fkey` FOREIGN KEY (`districtId`) REFERENCES `District`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Site
ALTER TABLE `Site` ADD COLUMN `subdistrict` VARCHAR(191) NULL;

-- AlterTable Job
ALTER TABLE `Job` ADD COLUMN `subdistrict` VARCHAR(191) NULL;
