-- User.role is a legacy Prisma enum (ADMIN/STAFF/USER/SUPERVISOR).
-- Custom AppRole codes (e.g. ADMIN_1) must live only in User.roleId / AppRole.
-- If MySQL ENUM was expanded (db push / manual ALTER) and a row stored a custom code,
-- Prisma findMany fails: Value '…' not found in enum 'Role'.

UPDATE `User`
SET `role` = 'STAFF'
WHERE `role` NOT IN ('ADMIN', 'STAFF', 'USER', 'SUPERVISOR');

ALTER TABLE `User`
  MODIFY COLUMN `role` ENUM('ADMIN', 'STAFF', 'USER', 'SUPERVISOR') NOT NULL DEFAULT 'STAFF';
