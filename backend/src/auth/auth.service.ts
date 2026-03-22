import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(identifier: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmailOrUsername(identifier);
        if (user && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const full = await this.usersService.findById(user.id);
        if (!full) {
            throw new UnauthorizedException();
        }
        const code = full.roleRef?.code?.trim();
        const effectiveRole = (code ? code : String(full.role ?? 'STAFF')).toUpperCase();
        const payload = { username: user.username, sub: user.id, role: effectiveRole };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: effectiveRole,
            },
        };
    }
}
