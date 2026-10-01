-- Step 1: Add new column
ALTER TABLE `Job` ADD COLUMN `requestTicketNo` VARCHAR(191) NULL;

-- Step 2: Copy RQ-* from ticketNo to requestTicketNo (unclassified jobs)
UPDATE `Job` SET `requestTicketNo` = `ticketNo`
WHERE `ticketNo` IS NOT NULL
  AND (`ticketNo` LIKE 'RQ-%');

-- Step 3: Clear ticketNo for unclassified jobs (they only have request no)
UPDATE `Job` SET `ticketNo` = NULL
WHERE `requestTicketNo` IS NOT NULL
  AND `ticketNo` IS NOT NULL
  AND (`ticketNo` LIKE 'RQ-%');

-- Step 4: Add unique constraint
CREATE UNIQUE INDEX `Job_requestTicketNo_key` ON `Job`(`requestTicketNo`);
