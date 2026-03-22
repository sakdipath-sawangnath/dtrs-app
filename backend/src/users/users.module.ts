import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PublicUsersController } from './public-users.controller';
import { RolesGuard } from '../auth/roles.guard';
import { MinioModule } from '../minio/minio.module';

@Module({
    imports: [MinioModule],
    providers: [UsersService, RolesGuard],
    controllers: [UsersController, PublicUsersController],
    exports: [UsersService],
})
export class UsersModule { }
