import { MinLength, IsString } from 'class-validator';

/** Default Pass สำหรับ Reset รหัสผ่านผู้ใช้ (ADMIN เท่านั้น) */
export class UpdateDefaultPassDto {
  @IsString()
  @MinLength(6, { message: 'กรุณาระบุ Default Pass อย่างน้อย 6 ตัวอักษร' })
  password!: string;
}
