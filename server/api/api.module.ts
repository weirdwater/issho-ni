import { Module } from '@nestjs/common';
import { SessionModule } from './session/session.module';
import { UserModule } from './user/user.module';
import { ClientModule } from './client/client.module';

@Module({
  imports: [SessionModule, UserModule, ClientModule],
})
export class ApiModule {}
