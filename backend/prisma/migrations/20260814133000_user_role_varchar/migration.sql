-- User.role เก็บ AppRole.code รวมบทบาทที่สร้างเอง (เช่น ADMIN_1)
-- เปลี่ยนจาก MySQL ENUM → VARCHAR เพื่อไม่ให้ Prisma client ปฏิเสธค่าที่ไม่อยู่ใน enum Role

ALTER TABLE `User`
  MODIFY COLUMN `role` VARCHAR(64) NOT NULL DEFAULT 'STAFF';
