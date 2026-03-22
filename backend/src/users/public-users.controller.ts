import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

/**
 * API สาธารณะสำหรับหน้า `/public/report` — ค้นหาผู้แจ้งจากเบอร์โทร
 * แยกจาก `UsersController` เพื่อไม่ให้ทับซ้อนกับเส้นที่ต้อง JWT
 */
@Controller('public/users')
export class PublicUsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('reporter-by-phone/:phone')
    async findReporterByPhone(@Param('phone') phone: string) {
        return this.usersService.findByPhone(phone);
    }
}
