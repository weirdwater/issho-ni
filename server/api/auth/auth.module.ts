import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthSession } from './authSession.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthController } from './auth.controller'
import { HttpStrategy } from './http.strategy'
import { PassportModule } from '@nestjs/passport'
import { User } from '../user/user.entity'
import { Client } from '../client/client.entity'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'bearer', property: 'consumer' }),
    TypeOrmModule.forFeature([AuthSession]),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Client]),
  ],
  providers: [AuthService, HttpStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
