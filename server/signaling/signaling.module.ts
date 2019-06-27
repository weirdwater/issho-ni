import { Module } from '@nestjs/common';
import { AuthModule } from 'server/api/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { SignalingGateway } from './signaling.gateway';
import { ClientModule } from 'server/api/client/client.module';

@Module({
  providers: [SignalingGateway],
  imports: [AuthModule, ClientModule],
})
export class SignalingModule {}
