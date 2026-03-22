import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }

    /** ค้นหาผู้ใช้ด้วย email หรือ username (สำหรับ login) */
    async findByEmailOrUsername(identifier: string) {
        if (!identifier?.trim()) return null;
        const id = identifier.trim();
        return this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: id },
                    { username: id },
                ],
            },
        });
    }

    async findById(id: number) {
        return this.prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, username: true, email: true, role: true, roleId: true, roleRef: { select: { id: true, code: true, name: true } }, phone: true, position: true, image: true },
        });
    }

    /**
     * บทบาทจริงสำหรับ authorization — ใช้ `AppRole.code` เมื่อมี `roleId`/`roleRef`
     * (แก้กรณี JWT เก่า / คอลัมน์ `User.role` ไม่ตรงกับ RBAC)
     */
    async getEffectiveRoleCode(userId: number): Promise<string | null> {
        const u = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, roleRef: { select: { code: true } } },
        });
        if (!u) return null;
        const code = u.roleRef?.code?.trim();
        if (code) return code.toUpperCase();
        return u.role != null ? String(u.role).toUpperCase() : null;
    }

    /** ค้นหาผู้ใช้จากเบอร์โทรศัพท์ (เฉพาะคนที่มี role เป็น USER หรือ STAFF) */
    async findByPhone(phone: string) {
        if (!phone?.trim()) return null;
        return this.prisma.user.findFirst({
            where: { phone: phone.trim() },
            select: { id: true, name: true, phone: true, email: true },
        });
    }

    /** อัปเดตโปรไฟล์ของตัวเอง (ไม่รวม role) — username อ้างอิง email เป็นหลัก */
    async updateProfile(id: number, data: { name?: string; email?: string; phone?: string; position?: string; image?: string }) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('ไม่พบผู้ใช้');
        const newEmail = data.email != null ? String(data.email).trim() : null;
        if (newEmail && newEmail !== user.email) {
            const existing = await this.prisma.user.findFirst({
                where: { id: { not: id }, OR: [{ email: newEmail }, { username: newEmail }] },
            });
            if (existing) throw new ConflictException('อีเมลนี้ถูกใช้แล้ว');
        }
        const updateData: Record<string, unknown> = { ...data };
        if (newEmail) updateData.username = newEmail;
        return this.prisma.user.update({
            where: { id },
            data: updateData as any,
            select: { id: true, name: true, username: true, email: true, role: true, phone: true, position: true, image: true },
        });
    }

    /** เปลี่ยนรหัสผ่านของตัวเอง (ต้องส่งรหัสเดิมมา) */
    async updateMyPassword(userId: number, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('ไม่พบผู้ใช้');
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) throw new ConflictException('รหัสผ่านปัจจุบันไม่ถูกต้อง');
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
        return { ok: true };
    }

    /** สร้างผู้ใช้ — ถ้ามี email ใช้ email เป็น username (อ้างอิงอีเมลเป็นหลัก) */
    async create(data: Prisma.UserCreateInput) {
        const email = data.email ? String(data.email).trim() : null;
        const username = email ?? (data.username ? String(data.username).trim() : null);
        if (!username) throw new ConflictException('ต้องระบุ email หรือ username');
        const existing = await this.prisma.user.findUnique({ where: { username } });
        if (existing) throw new ConflictException('username/อีเมลนี้ถูกใช้แล้ว');
        if (email) {
            const byEmail = await this.prisma.user.findFirst({ where: { email } });
            if (byEmail) throw new ConflictException('อีเมลนี้ถูกใช้แล้ว');
        }
        const hashed = data.password ? await bcrypt.hash(String(data.password), 10) : await bcrypt.hash('changeme123', 10);
        const roleCode = (data as any).role as string | undefined;
        let roleId: number | undefined;
        let resolvedRoleEnum: Role | undefined;
        if (roleCode) {
            const appRole = await this.prisma.appRole.findUnique({ where: { code: roleCode.toUpperCase() } });
            if (appRole) {
                roleId = appRole.id;
                resolvedRoleEnum = appRole.code as Role;
            }
        }
        const createData: Prisma.UserCreateInput = {
            ...data,
            username,
            email: email || undefined,
            password: hashed,
            role: resolvedRoleEnum ?? (data as { role?: Role }).role,
            roleRef: roleId != null ? { connect: { id: roleId } } : undefined,
        };
        return this.prisma.user.create({
            data: createData,
            select: { id: true, name: true, username: true, email: true, role: true, roleId: true, phone: true, position: true },
        });
    }

    /** แก้ไขผู้ใช้ — ถ้ามี email ให้ sync username = email (อ้างอิงอีเมลเป็นหลัก) */
    async update(id: number, data: { name?: string; email?: string; phone?: string; position?: string; image?: string; role?: Prisma.EnumRoleFieldUpdateOperationsInput }) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('ไม่พบผู้ใช้');
        const updateData: Record<string, unknown> = { ...data };
        if (updateData.email != null) {
            const email = String(updateData.email).trim();
            if (email) {
                updateData.username = email;
                const existing = await this.prisma.user.findFirst({
                    where: {
                        id: { not: id },
                        OR: [{ email }, { username: email }],
                    },
                    select: { id: true },
                });
                if (existing) throw new ConflictException('อีเมลนี้ถูกใช้โดยผู้ใช้อื่นแล้ว');
            }
        }
        const roleCode = (updateData as any).role as string | undefined;
        if (roleCode) {
            const appRole = await this.prisma.appRole.findUnique({ where: { code: roleCode.toUpperCase() } });
            if (appRole) {
                (updateData as any).roleId = appRole.id;
                (updateData as any).role = appRole.code as Role;
            }
        }
        return this.prisma.user.update({
            where: { id },
            data: updateData as any,
            select: { id: true, name: true, username: true, email: true, role: true, roleId: true, phone: true, position: true, image: true },
        });
    }

    async updatePassword(id: number, newPassword: string) {
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({ where: { id }, data: { password: hashed } });
        return { ok: true };
    }

    async updateImage(id: number, imageUrl: string) {
        return this.prisma.user.update({
            where: { id },
            data: { image: imageUrl },
            select: { id: true, name: true, username: true, email: true, role: true, roleId: true, phone: true, position: true, image: true },
        });
    }

    async remove(id: number) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('ไม่พบผู้ใช้');
        if (user.role === Role.ADMIN) {
            const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
            if (adminCount <= 1) {
                throw new BadRequestException('ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายในระบบได้');
            }
        }
        await this.prisma.user.delete({ where: { id } });
        return { ok: true };
    }

    async findAll() {
        return this.prisma.user.findMany({
            select: { id: true, name: true, username: true, email: true, role: true, roleId: true, roleRef: { select: { code: true, name: true } }, phone: true, position: true, image: true },
            orderBy: [{ role: 'asc' }, { username: 'asc' }],
        });
    }

    async findByRole(role: string) {
        return this.prisma.user.findMany({
            where: { role: role as any },
            select: { id: true, name: true, phone: true, email: true },
            orderBy: { name: 'asc' },
        });
    }

    /** รายชื่อผู้ที่สามารถรับมอบหมายงานได้ (ADMIN, STAFF, SUPERVISOR) */
    async findAssignable() {
        return this.prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'STAFF', 'SUPERVISOR'] } },
            select: { id: true, name: true, username: true, email: true },
            orderBy: { name: 'asc' },
        });
    }
}

