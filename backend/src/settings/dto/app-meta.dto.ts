import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAppMetaDto {
  @IsString()
  @MaxLength(120, { message: 'ชื่อระบบยาวเกิน 120 ตัวอักษร' })
  appName!: string;

  @IsString()
  @MaxLength(120, { message: 'ชื่อบริษัท/หน่วยงานยาวเกิน 120 ตัวอักษร' })
  companyName!: string;

  /** Ignored on save — product version comes from frontend/package.json (SemVer bump). */
  @IsOptional()
  @IsString()
  @MaxLength(40, { message: 'เวอร์ชันยาวเกิน 40 ตัวอักษร' })
  version?: string;
}
