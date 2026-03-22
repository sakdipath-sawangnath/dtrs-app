import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body: { email?: string; username?: string; password: string }) {
        const identifier = body.email ?? body.username;
        if (!identifier || !body.password) {
            throw new UnauthorizedException('กรุณากรอกอีเมล/ชื่อผู้ใช้และรหัสผ่าน');
        }
        const user = await this.authService.validateUser(identifier, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }
}
