import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  InternalServerErrorException,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from '../minio/minio.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly minioService: MinioService,
  ) {}

  /** จัดการผู้ใช้ — สิทธิ์ menu.users */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('menu.users')
  @Get()
  async findAll() {
    try {
      return await this.usersService.findAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      throw new InternalServerErrorException({
        message: 'ไม่สามารถโหลดรายชื่อผู้ใช้ได้',
        error: msg,
      });
    }
  }

  /** ดึงเฉพาะผู้แจ้งซ่อม (role=USER) สำหรับ dropdown ในฟอร์มแจ้งซ่อม (Deprecated) */
  @Get('reporters')
  async findReporters() {
    return this.usersService.findByRole('USER');
  }

  /** รายชื่อเจ้าหน้าที่ที่มอบหมายงานได้ — อิง RBAC `job.assign` (สอดคล้อง PATCH /jobs/:id/assign และ JobsList) */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('job.assign')
  @Get('assignable')
  async findAssignable() {
    return this.usersService.findAssignable();
  }

  /** โปรไฟล์ของตัวเอง (ต้อง login) */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: { user: { id: number } }) {
    return this.usersService.findById(req.user.id);
  }

  /** สตรีมรูปโปรไฟล์ของตัวเอง — ใช้กับ Next `/user-images/:userId` */
  @UseGuards(JwtAuthGuard)
  @Get('me/avatar')
  async streamMyAvatar(
    @Req() req: { user: { id: number } },
    @Res() res: Response,
  ) {
    const { buffer, contentType } =
      await this.usersService.getAvatarImageBuffer(req.user.id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=120');
    res.send(buffer);
  }

  /** เปลี่ยนรหัสผ่านของตัวเอง (ต้องอยู่ก่อน me) */
  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  async updateMyPassword(
    @Req() req: { user: { id: number } },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.updateMyPassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  /** อัปเดตโปรไฟล์ของตัวเอง */
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @Req() req: { user: { id: number } },
    @Body()
    body: {
      name?: string;
      email?: string;
      phone?: string;
      position?: string;
      image?: string;
    },
  ) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  /** อัปโหลดรูปโปรไฟล์ของตัวเอง (avatar) */
  @UseGuards(JwtAuthGuard)
  @Patch('me/avatar')
  @UseInterceptors(FileInterceptor('image'))
  async uploadMyAvatar(
    @Req() req: { user: { id: number } },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new InternalServerErrorException({ message: 'ไม่พบไฟล์รูปภาพ' });
    }
    const url = await this.minioService.uploadUserAvatar(req.user.id, file);
    return this.usersService.updateImage(req.user.id, url);
  }

  /** อัปโหลดลายเซ็นของตัวเอง */
  @UseGuards(JwtAuthGuard)
  @Patch('me/signature')
  @UseInterceptors(FileInterceptor('signature'))
  async uploadMySignature(
    @Req() req: { user: { id: number } },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new InternalServerErrorException({ message: 'ไม่พบไฟล์ลายเซ็น' });
    }
    const url = await this.minioService.uploadUserSignature(req.user.id, file);
    return this.usersService.updateSignature(req.user.id, url);
  }

  /** สตรีมลายเซ็นของตัวเอง */
  @UseGuards(JwtAuthGuard)
  @Get('me/signature')
  async streamMySignature(
    @Req() req: { user: { id: number } },
    @Res() res: Response,
  ) {
    const { buffer, contentType } =
      await this.usersService.getSignatureImageBuffer(req.user.id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=120');
    res.send(buffer);
  }

  /** สตรีมรูปโปรไฟล์ตาม user id — ต้อง JWT (แดชบอร์ด); ต้องอยู่ก่อน @Get(':id') */
  @UseGuards(JwtAuthGuard)
  @Get(':id/avatar')
  async streamUserAvatar(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, contentType } =
      await this.usersService.getAvatarImageBuffer(id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=120');
    res.send(buffer);
  }

  /** สตรีมลายเซ็นตาม user id — ต้องอยู่ก่อน @Get(':id') */
  @UseGuards(JwtAuthGuard)
  @Get(':id/signature')
  async streamUserSignature(
    @Req() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    await this.usersService.assertCanViewSignature(req.user.id, id);
    const { buffer, contentType } =
      await this.usersService.getSignatureImageBuffer(id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=120');
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('menu.users')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(+id);
  }

  /** สร้างผู้ใช้ */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('menu.users')
  @Post()
  async create(@Body() createUserDto: Prisma.UserCreateInput) {
    return this.usersService.create(createUserDto);
  }

  /** เปลี่ยนรหัสผ่าน (ต้องอยู่ก่อน :id) */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('menu.users')
  @Patch(':id/password')
  async updatePassword(
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    return this.usersService.updatePassword(+id, body.password);
  }

  /** รีเซ็ตรหัสผ่านเป็น Default Pass */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('menu.users')
  @Post(':id/reset-password')
  async resetPasswordToDefault(@Param('id') id: string) {
    return this.usersService.resetPasswordToDefault(+id);
  }

  /** แก้ไขผู้ใช้ (ชื่อ, อีเมล, เบอร์, ตำแหน่ง, role) */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('menu.users')
  @Patch(':id')
  async update(
    @Req() req: { user: { id: number } },
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      phone?: string;
      position?: string;
      role?: string;
      isLocked?: boolean;
    },
  ) {
    const roleUpdate =
      body.role != null ? { role: body.role as any } : undefined;
    return this.usersService.update(
      +id,
      { ...body, ...roleUpdate } as any,
      req.user.id,
    );
  }

  /** อัปโหลดรูปโปรไฟล์ผู้ใช้ */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('menu.users')
  @Patch(':id/avatar')
  @UseInterceptors(FileInterceptor('image'))
  async uploadUserAvatar(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new InternalServerErrorException({ message: 'ไม่พบไฟล์รูปภาพ' });
    }
    const userId = +id;
    const url = await this.minioService.uploadUserAvatar(userId, file);
    return this.usersService.updateImage(userId, url);
  }

  /** ลบผู้ใช้ */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('menu.users')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
