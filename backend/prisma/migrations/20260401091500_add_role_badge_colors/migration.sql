-- Add editable badge colors for AppRole
ALTER TABLE `AppRole`
  ADD COLUMN `badgeTextColor` VARCHAR(7) NULL,
  ADD COLUMN `badgeBgColor` VARCHAR(7) NULL;
