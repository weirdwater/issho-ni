import { Module } from '@nestjs/common';
import { AuthModule } from '../api/auth/auth.module';
import { SignalingGateway } from './signaling.gateway';
import { ClientModule } from '../api/client/client.module';

@Module({
  providers: [SignalingGateway],
  imports: [AuthModule, ClientModule],
})
export class SignalingModule {}
