import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === '1') return true;
  return false;
}

/** บันทึกการตั้งค่า SMTP (password ว่าง = คงรหัสเดิม) */
export class UpdateEmailSmtpDto {
  @IsString()
  @MinLength(1, { message: 'กรุณาระบุ SMTP Host' })
  smtpHost!: string;

  @IsString()
  @Matches(/^\d{1,5}$/, { message: 'พอร์ตต้องเป็นตัวเลข' })
  smtpPort!: string;

  @IsString()
  @MinLength(1, { message: 'กรุณาระบุ Username' })
  username!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  secure!: boolean;

  @IsEmail({}, { message: 'รูปแบบอีเมลผู้ส่งไม่ถูกต้อง' })
  from!: string;

  /** true = ตรวจใบรับรอง TLS (ค่าเริ่มต้น); false = ยอมรับ self-signed / Internal CA */
  @Transform(({ value }) => (value === undefined ? true : toBool(value)))
  @IsBoolean()
  tlsRejectUnauthorized!: boolean;
}

/** ทดสอบส่ง — ส่งเฉพาะฟิลด์ที่ต้องการ override; ที่เหลือดึงจากที่บันทึก */
export class TestEmailSmtpDto {
  @IsEmail({}, { message: 'รูปแบบอีเมลปลายทางไม่ถูกต้อง' })
  to!: string;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,5}$/, { message: 'พอร์ตต้องเป็นตัวเลข' })
  smtpPort?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : toBool(value)))
  @IsBoolean()
  secure?: boolean;

  @IsOptional()
  @IsEmail({}, { message: 'รูปแบบอีเมลผู้ส่งไม่ถูกต้อง' })
  from?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : toBool(value)))
  @IsBoolean()
  tlsRejectUnauthorized?: boolean;
}
