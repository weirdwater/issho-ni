import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthSession } from './authSession.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { ClientModule } from '../client/client.module';
import { UserModule } from '../user/user.module';
import { HttpStrategy } from './http.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'bearer' }),
    TypeOrmModule.forFeature([AuthSession]),
    UserModule,
    ClientModule,
  ],
  providers: [AuthService, HttpStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
