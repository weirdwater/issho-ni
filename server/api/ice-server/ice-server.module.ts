import { Module } from '@nestjs/common'
import { IceServerController } from './ice-server.controller'
import { AuthModule } from '../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from 'server/config/config.module';

@Module({
  controllers: [IceServerController],
  imports: [
    AuthModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'bearer', property: 'consumer' }),
  ],
})
export class IceServerModule {}
