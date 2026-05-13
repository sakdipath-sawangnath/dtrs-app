-- =============================================================================
-- แก้ reportDate / fixDate สำหรับ Job ที่เลขที่ (ticketNo) ระบุ
-- กฎ: ปี -1, สลับเดือน↔วันในปฏิทิน, จากนั้นเลื่อนเวลา ±10..15 นาที (CRC32 ต่อ ticketNo)
--
-- แก้ Error จาก STR_TO_DATE(...'%f') บางเวอร์ชัน MySQL/MariaDB ไม่รองรับหรือคืน NULL
-- ใช้เฉพาะ %H:%i:%s (ไม่พึ่ง fractional ใน pattern)
--
-- แนะนำ: สำรองตาราง Job ก่อนรัน UPDATE
-- =============================================================================

-- USE `cctv_app_db`;

SELECT id, ticketNo, status, reportDate, fixDate, updatedAt
FROM `Job`
WHERE `ticketNo` IN (
  'aac2ae38',
  'f0b086b8',
  'ce12b801',
  '8fb4b3e8',
  '7837b3ce',
  '2ff34106',
  'dc812481',
  'c2af005f',
  'befefd0e',
  '31ee4891',
  '34325a8a',
  '2b032122',
  'b7f8817e',
  '6585dd12',
  'f03f0524'
);

/* แปลง: ปีใหม่ = ปีเดิม - 1, เดือนใหม่ = วันเดิม, วันใหม่ = เดือนเดิม — เวลาเก็บชั่วโมง:นาที:วินาที */
UPDATE `Job`
SET
  `reportDate` = DATE_ADD(
    STR_TO_DATE(
      CONCAT(
        YEAR(`reportDate`) - 1,
        '-',
        LPAD(DAY(`reportDate`), 2, '0'),
        '-',
        LPAD(MONTH(`reportDate`), 2, '0'),
        ' ',
        DATE_FORMAT(`reportDate`, '%H:%i:%s')
      ),
      '%Y-%m-%d %H:%i:%s'
    ),
    INTERVAL
      (CASE WHEN CRC32(CONCAT(IFNULL(`ticketNo`, ''), ':report')) % 2 = 0 THEN 1 ELSE -1 END)
      * (10 + (CRC32(CONCAT(IFNULL(`ticketNo`, ''), ':report')) % 6))
    MINUTE
  ),
  `fixDate` = CASE
    WHEN `fixDate` IS NULL THEN NULL
    ELSE DATE_ADD(
      STR_TO_DATE(
        CONCAT(
          YEAR(`fixDate`) - 1,
          '-',
          LPAD(DAY(`fixDate`), 2, '0'),
          '-',
          LPAD(MONTH(`fixDate`), 2, '0'),
          ' ',
          DATE_FORMAT(`fixDate`, '%H:%i:%s')
        ),
        '%Y-%m-%d %H:%i:%s'
      ),
      INTERVAL
        (CASE WHEN CRC32(CONCAT(IFNULL(`ticketNo`, ''), ':fix')) % 2 = 0 THEN 1 ELSE -1 END)
        * (10 + (CRC32(CONCAT(IFNULL(`ticketNo`, ''), ':fix')) % 6))
      MINUTE
    )
  END,
  `updatedAt` = NOW(3)
WHERE `ticketNo` IN (
  'aac2ae38',
  'f0b086b8',
  'ce12b801',
  '8fb4b3e8',
  '7837b3ce',
  '2ff34106',
  'dc812481',
  'c2af005f',
  'befefd0e',
  '31ee4891',
  '34325a8a',
  '2b032122',
  'b7f8817e',
  '6585dd12',
  'f03f0524'
)
  AND `reportDate` IS NOT NULL;

/* รันคำสั่ง UPDATE แยกบรรทัดแล้วดูจำนวนแถวที่ client แสดง — ROW_COUNT() หลังรันสคริปต์ทั้งก้อนอาจไม่ตรง */
SELECT id, ticketNo, status, reportDate, fixDate, updatedAt
FROM `Job`
WHERE `ticketNo` IN (
  'aac2ae38',
  'f0b086b8',
  'ce12b801',
  '8fb4b3e8',
  '7837b3ce',
  '2ff34106',
  'dc812481',
  'c2af005f',
  'befefd0e',
  '31ee4891',
  '34325a8a',
  '2b032122',
  'b7f8817e',
  '6585dd12',
  'f03f0524'
)
ORDER BY `id`;
