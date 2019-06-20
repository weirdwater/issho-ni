import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './client.entity';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client]),
    PassportModule.register({ defaultStrategy: 'bearer', property: 'consumer' }),
    AuthModule,
  ],
  controllers: [ ClientController ],
  providers: [ ClientService ],
  exports: [ ClientService ],
})
export class ClientModule {}
