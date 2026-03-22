import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            // ปรับให้อยู่ได้นานขึ้นสำหรับการใช้งาน Dashboard จริง
            signOptions: { expiresIn: '7d' },
        }),
    ],
    providers: [AuthService, JwtStrategy, RolesGuard],
    controllers: [AuthController],
    exports: [AuthService, RolesGuard, JwtModule],
})
export class AuthModule { }
