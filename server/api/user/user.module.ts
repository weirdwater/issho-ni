import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { User } from './user.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PassportModule } from '@nestjs/passport'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'bearer', property: 'consumer' }),
    TypeOrmModule.forFeature([User]),
    AuthModule,
  ],
  controllers: [ UserController ],
  providers: [ UserService ],
  exports: [ UserService ],
})
export class UserModule {}
