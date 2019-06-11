import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './session.entity';
import { ActiveSession } from './activeSession.entity';

@Module({
  imports: [ TypeOrmModule.forFeature([Session]), TypeOrmModule.forFeature([ActiveSession]) ],
  controllers: [ SessionController ],
  providers: [ SessionService ],
})
export class SessionModule {}
