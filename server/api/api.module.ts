import { Module } from '@nestjs/common';
import { SessionModule } from './session/session.module';
import { UserModule } from './user/user.module';
import { ClientModule } from './client/client.module';
import { AuthModule } from './auth/auth.module';
import { SongModule } from './song/song.module';

@Module({
  imports: [SessionModule, UserModule, ClientModule, AuthModule, SongModule],
})
export class ApiModule {}
