import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_PASS_SETTING_KEY } from '../settings/settings.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    private readonly DEFAULT_PASS_SENTINEL = "__DEFAULT_PASS__";
    private readonly DEFAULT_PASS_FALLBACK = "F0rth2026@";

    private async resolvePassword(rawPassword: string | null | undefined): Promise<string> {
        const pwd = typeof rawPassword === "string" ? rawPassword.trim() : "";
        if (!pwd) return this.DEFAULT_PASS_FALLBACK;

        if (pwd === this.DEFAULT_PASS_SENTINEL) {
            const row = await this.prisma.setting.findUnique({
                where: { key: DEFAULT_PASS_SETTING_KEY },
                select: { value: true },
            });
            const v = row?.value as any;
            const storedPwd = v && typeof v === "object" && !Array.isArray(v) ? String(v.password ?? "").trim() : "";
            return storedPwd || this.DEFAULT_PASS_FALLBACK;
        }
        return pwd;
    }

    private mapToEnumRole(code: string | null | undefined): Role | null {
        const c = code?.trim()?.toUpperCase();
        if (!c) return null;
        if (c === Role.ADMIN) return Role.ADMIN;
        if (c === Role.STAFF) return Role.STAFF;
        if (c === Role.USER) return Role.USER;
        if (c === Role.SUPERVISOR) return Role.SUPERVISOR;
        return null;
    }

    /**
     * สำหรับส่งกลับ client:
     * - ถ้ามี roleRef ใช้ AppRole.code (รองรับ role ที่เพิ่มเอง)
     * - ถ้าไม่มี roleRef ใช้ enum role
     */
    private mapUserRoleForClient<T extends { role: Role; roleRef?: { code?: string | null } | null }>(
        u: T,
    ): Omit<T, "role"> & { role: string } {
        const code = u.roleRef?.code?.trim();
        return { ...(u as any), role: (code ? String(code) : String(u.role)).toUpperCase() } as any;
    }

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
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, username: true, email: true, role: true, roleId: true, roleRef: { select: { id: true, code: true, name: true } }, phone: true, position: true, image: true },
        });
        if (!user) return null;
        return this.mapUserRoleForClient(user as any);
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

        const phone = typeof data.phone === "string" ? data.phone.trim() : null;
        if (phone) {
            const byPhone = await this.prisma.user.findFirst({ where: { phone } });
            if (byPhone) throw new ConflictException('เบอร์โทรนี้ถูกใช้แล้ว');
        }

        const fullName = typeof data.name === "string" ? data.name.trim() : null;
        if (fullName) {
            const byName = await this.prisma.user.findFirst({ where: { name: fullName } });
            if (byName) throw new ConflictException('ชื่อ-สกุลนี้ถูกใช้แล้ว');
        }

        const resolvedPassword = await this.resolvePassword(
            data.password ? String(data.password) : undefined,
        );
        const hashed = await bcrypt.hash(resolvedPassword, 10);
        const roleCode = typeof (data as any).role === "string" ? String((data as any).role) : undefined;
        let roleId: number | undefined;
        const enumRole = this.mapToEnumRole(roleCode);
        if (roleCode) {
            const appRole = await this.prisma.appRole.findUnique({
                where: { code: roleCode.toUpperCase() },
            });
            if (appRole) roleId = appRole.id;
        }
        const createData: Prisma.UserCreateInput = {
            ...data,
            username,
            email: email || undefined,
            password: hashed,
            // user.role เป็น enum (Prisma schema) รองรับแค่ ADMIN/STAFF/USER/SUPERVISOR
            // ถ้า roleCode เป็นค่าใหม่ (เช่น CCTV) ให้เก็บไว้ที่ roleRef/roleId แทน
            role: enumRole ?? Role.STAFF,
            roleRef: roleId != null ? { connect: { id: roleId } } : undefined,
        };
        const created = await this.prisma.user.create({
            data: createData,
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
                roleId: true,
                roleRef: { select: { code: true } },
                phone: true,
                position: true,
            },
        });
        return this.mapUserRoleForClient(created as any);
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
        const roleCode = typeof (updateData as any).role === "string" ? String((updateData as any).role) : undefined;
        if (roleCode) {
            const appRole = await this.prisma.appRole.findUnique({
                where: { code: roleCode.toUpperCase() },
            });
            if (appRole) {
                // roleRef/roleId เป็นทางเดียวที่รองรับ role code ที่เพิ่มเอง
                (updateData as any).roleId = appRole.id;
            }
            // สำคัญ: ห้าม set user.role เป็นค่า custom (Prisma enum จะ error)
            (updateData as any).role = this.mapToEnumRole(roleCode) ?? Role.STAFF;
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: updateData as any,
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
                roleId: true,
                roleRef: { select: { code: true } },
                phone: true,
                position: true,
                image: true,
            },
        });
        return this.mapUserRoleForClient(updated as any);
    }

    async updatePassword(id: number, newPassword: string) {
        const resolved = await this.resolvePassword(newPassword);
        const hashed = await bcrypt.hash(resolved, 10);
        await this.prisma.user.update({ where: { id }, data: { password: hashed } });
        return { ok: true };
    }

    async resetPasswordToDefault(id: number) {
        return this.updatePassword(id, this.DEFAULT_PASS_SENTINEL);
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
        const users = await this.prisma.user.findMany({
            select: { id: true, name: true, username: true, email: true, role: true, roleId: true, roleRef: { select: { code: true, name: true } }, phone: true, position: true, image: true },
            orderBy: [{ role: 'asc' }, { username: 'asc' }],
        });
        return users.map((u) => this.mapUserRoleForClient(u as any));
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

