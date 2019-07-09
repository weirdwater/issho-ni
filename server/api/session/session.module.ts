import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './session.entity';
import { ActiveSession } from './activeSession.entity';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'bearer', property: 'consumer' }),
    TypeOrmModule.forFeature([Session]),
    TypeOrmModule.forFeature([ActiveSession]),
    AuthModule,
  ],
  exports: [ SessionService ],
  controllers: [ SessionController ],
  providers: [ SessionService ],
})
export class SessionModule {}
