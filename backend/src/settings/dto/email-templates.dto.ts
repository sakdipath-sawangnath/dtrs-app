import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class EmailTemplateBlockDto {
  @IsBoolean()
  enabled!: boolean;

  @IsArray()
  @IsEmail({}, { each: true, message: 'อีเมลใน To เพิ่มเติมไม่ถูกต้อง' })
  toExtra!: string[];

  @IsArray()
  @IsEmail({}, { each: true, message: 'อีเมลใน CC ไม่ถูกต้อง' })
  cc!: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true, message: 'รหัสบทบาทต้องเป็นจำนวนเต็ม' })
  notifyRoleIds?: number[];
}

export class UpdateEmailTemplatesDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  brandingLogoUrl?: string;

  /** ว่างได้ — ถ้ามีต้องขึ้นต้นด้วย http:// หรือ https:// */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^$|^https?:\/\/[^\s]+$/i, {
    message:
      'Public URL สำหรับลิงก์ในอีเมลต้องว่าง หรือเป็น URL ที่ขึ้นต้นด้วย http:// หรือ https://',
  })
  publicBaseUrl?: string;

  @ValidateNested()
  @Type(() => EmailTemplateBlockDto)
  onReported!: EmailTemplateBlockDto;

  @ValidateNested()
  @Type(() => EmailTemplateBlockDto)
  onAssigned!: EmailTemplateBlockDto;

  @ValidateNested()
  @Type(() => EmailTemplateBlockDto)
  onClosed!: EmailTemplateBlockDto;
}
