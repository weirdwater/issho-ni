import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { ApiModule } from './api/api.module';
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConnectionOptions } from 'typeorm';
import { ConfigService } from './config/config.service';

const dbConfigFactory = async (configService: ConfigService): Promise<ConnectionOptions> => ({
  type: 'postgres',
  host: configService.postgresHost,
  port: configService.postgresPort,
  username: configService.postgresUser,
  password: configService.postgresPassword,
  database: configService.postgresDatabase,
  entities: [ __dirname + '/**/*.entity.ts' ],
  synchronize: configService.typeOrmSync,
})

@Module({
  imports: [ConfigModule, TypeOrmModule.forRootAsync({ imports: [ConfigModule], useFactory: dbConfigFactory, inject: [ConfigService] }), ApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
