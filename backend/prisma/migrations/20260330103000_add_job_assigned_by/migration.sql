-- AlterTable
ALTER TABLE `Job` ADD COLUMN `assignedById` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Job_assignedById_idx` ON `Job`(`assignedById`);

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_assignedById_fkey` FOREIGN KEY (`assignedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
