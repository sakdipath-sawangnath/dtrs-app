import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: { sub?: number; username?: string; role?: string }) {
    const id = Number(payload.sub);
    if (!Number.isFinite(id)) {
      throw new UnauthorizedException();
    }
    const locked = await this.usersService.isLoginLocked(id);
    if (locked) {
      throw new UnauthorizedException('บัญชีถูกระงับการเข้าสู่ระบบ');
    }
    return { id, username: payload.username, role: payload.role };
  }
}
