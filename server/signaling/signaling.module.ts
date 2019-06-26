import { Module } from '@nestjs/common';
import { AuthModule } from 'server/api/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { SignalingGateway } from './signaling.gateway';

@Module({
  providers: [SignalingGateway],
  imports: [AuthModule],
})
export class SignalingModule {}
