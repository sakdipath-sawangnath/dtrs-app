import { Controller, Get, Param, Post, Body, Patch, Delete, UseGuards, InternalServerErrorException, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from '../minio/minio.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly minioService: MinioService,
    ) { }

    /** เฉพาะ ADMIN ดู/จัดการรายชื่อผู้ใช้ได้ (RBAC) */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get()
    async findAll() {
        try {
            return await this.usersService.findAll();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            throw new InternalServerErrorException({ message: 'ไม่สามารถโหลดรายชื่อผู้ใช้ได้', error: msg });
        }
    }

    /** ดึงเฉพาะผู้แจ้งซ่อม (role=USER) สำหรับ dropdown ในฟอร์มแจ้งซ่อม (Deprecated) */
    @Get('reporters')
    async findReporters() {
        return this.usersService.findByRole('USER');
    }

    /** รายชื่อเจ้าหน้าที่ที่มอบหมายงานได้ (STAFF/SUPERVISOR) */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPERVISOR', 'STAFF')
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

    /** เปลี่ยนรหัสผ่านของตัวเอง (ต้องอยู่ก่อน me) */
    @UseGuards(JwtAuthGuard)
    @Patch('me/password')
    async updateMyPassword(@Req() req: { user: { id: number } }, @Body() body: { currentPassword: string; newPassword: string }) {
        return this.usersService.updateMyPassword(req.user.id, body.currentPassword, body.newPassword);
    }

    /** อัปเดตโปรไฟล์ของตัวเอง */
    @UseGuards(JwtAuthGuard)
    @Patch('me')
    async updateMe(@Req() req: { user: { id: number } }, @Body() body: { name?: string; email?: string; phone?: string; position?: string; image?: string }) {
        return this.usersService.updateProfile(req.user.id, body);
    }

    /** อัปโหลดรูปโปรไฟล์ของตัวเอง (avatar) */
    @UseGuards(JwtAuthGuard)
    @Patch('me/avatar')
    @UseInterceptors(FileInterceptor('image'))
    async uploadMyAvatar(@Req() req: { user: { id: number } }, @UploadedFile() file?: Express.Multer.File) {
        if (!file) {
            throw new InternalServerErrorException({ message: 'ไม่พบไฟล์รูปภาพ' });
        }
        const url = await this.minioService.uploadUserAvatar(req.user.id, file);
        return this.usersService.updateImage(req.user.id, url);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.usersService.findById(+id);
    }

    /** สร้างผู้ใช้ - เฉพาะ ADMIN */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post()
    async create(@Body() createUserDto: Prisma.UserCreateInput) {
        return this.usersService.create(createUserDto);
    }

    /** เปลี่ยนรหัสผ่าน - เฉพาะ ADMIN (ต้องอยู่ก่อน :id) */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/password')
    async updatePassword(@Param('id') id: string, @Body() body: { password: string }) {
        return this.usersService.updatePassword(+id, body.password);
    }

    /** รีเซ็ตรหัสผ่านเป็น Default Pass (เฉพาะ ADMIN) */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post(':id/reset-password')
    async resetPasswordToDefault(@Param('id') id: string) {
        return this.usersService.resetPasswordToDefault(+id);
    }

    /** แก้ไขผู้ใช้ (ชื่อ, อีเมล, เบอร์, ตำแหน่ง, role) - เฉพาะ ADMIN */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: { name?: string; email?: string; phone?: string; position?: string; role?: string }) {
        const roleUpdate = body.role != null ? { role: body.role as any } : undefined;
        return this.usersService.update(+id, { ...body, ...roleUpdate } as any);
    }

    /** อัปโหลดรูปโปรไฟล์ผู้ใช้ (ADMIN เท่านั้น) */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/avatar')
    @UseInterceptors(FileInterceptor('image'))
    async uploadUserAvatar(@Param('id') id: string, @UploadedFile() file?: Express.Multer.File) {
        if (!file) {
            throw new InternalServerErrorException({ message: 'ไม่พบไฟล์รูปภาพ' });
        }
        const userId = +id;
        const url = await this.minioService.uploadUserAvatar(userId, file);
        return this.usersService.updateImage(userId, url);
    }

    /** ลบผู้ใช้ - เฉพาะ ADMIN */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.usersService.remove(+id);
    }
}

