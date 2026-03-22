import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Req } from '@nestjs/common';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /** รายการบทบาททั้งหมด (ADMIN เท่านั้น) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async findAll() {
    return this.rolesService.findAllRoles();
  }

  /** รายการสิทธิ์ทั้งหมด (สำหรับเลือกใส่ให้บทบาท) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('permissions')
  async findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  /** สิทธิ์ของตัวเอง (สำหรับแสดงเมนูตามสิทธิ์) */
  @UseGuards(JwtAuthGuard)
  @Get('me/permissions')
  async getMyPermissions(@Req() req: { user: { id: number } }) {
    const codes = await this.rolesService.getPermissionsForUser(req.user.id);
    return { permissions: codes };
  }

  /** ดูบทบาทตาม id พร้อมสิทธิ์ */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rolesService.findRoleById(+id);
  }

  /** สิทธิ์ของบทบาท (id ของ role) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/permissions')
  async getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissionIds(+id);
  }

  /** ตั้งค่าสิทธิ์ของบทบาท */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/permissions')
  async setRolePermissions(@Param('id') id: string, @Body() body: { permissionIds: number[] }) {
    return this.rolesService.setRolePermissions(+id, Array.isArray(body.permissionIds) ? body.permissionIds : []);
  }

  /** สร้างบทบาทใหม่ */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async create(@Body() body: { code: string; name: string; description?: string }) {
    return this.rolesService.createRole(body);
  }

  /** แก้ไขบทบาท (ชื่อ, คำอธิบาย) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { name?: string; description?: string }) {
    return this.rolesService.updateRole(+id, body);
  }

  /** ลบบทบาท (ต้องไม่มีผู้ใช้ผูกอยู่) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.rolesService.deleteRole(+id);
  }
}
