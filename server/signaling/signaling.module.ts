import { Module } from '@nestjs/common'
import { AuthModule } from '../api/auth/auth.module'
import { SignalingGateway } from './signaling.gateway'
import { ClientModule } from '../api/client/client.module'
import { SessionModule } from '../api/session/session.module'
import { UserModule } from '../api/user/user.module';

@Module({
  providers: [SignalingGateway],
  imports: [AuthModule, ClientModule, SessionModule, UserModule],
})
export class SignalingModule {}
