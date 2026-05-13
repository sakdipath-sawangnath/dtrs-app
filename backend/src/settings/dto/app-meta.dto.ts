import { IsString, MaxLength } from 'class-validator';

export class UpdateAppMetaDto {
  @IsString()
  @MaxLength(120, { message: 'ชื่อระบบยาวเกิน 120 ตัวอักษร' })
  appName!: string;

  @IsString()
  @MaxLength(120, { message: 'ชื่อบริษัท/หน่วยงานยาวเกิน 120 ตัวอักษร' })
  companyName!: string;

  @IsString()
  @MaxLength(40, { message: 'เวอร์ชันยาวเกิน 40 ตัวอักษร' })
  version!: string;
}
