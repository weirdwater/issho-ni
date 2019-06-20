import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthSession } from './authSession.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { ClientModule } from '../client/client.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ TypeOrmModule.forFeature([AuthSession]), UserModule, ClientModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
