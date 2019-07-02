import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from './config/config.module'
import { ApiModule } from './api/api.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConnectionOptions } from 'typeorm'
import { ConfigService } from './config/config.service'
import { SignalingModule } from './signaling/signaling.module'
import { RavenModule, RavenInterceptor } from 'nest-raven'
import { APP_INTERCEPTOR } from '@nestjs/core';

const dbConfigFactory = async (configService: ConfigService): Promise<ConnectionOptions> => ({
  type: 'postgres',
  host: configService.postgresHost,
  port: configService.postgresPort,
  username: configService.postgresUser,
  password: configService.postgresPassword,
  database: configService.postgresDatabase,
  entities: [ __dirname + '/**/*.entity.ts', __dirname + '/**/*.entity.js' ],
  synchronize: configService.typeOrmSync,
})

@Module({
  imports: [
    RavenModule,
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: dbConfigFactory,
      inject: [ConfigService],
    }),
    ApiModule,
    SignalingModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useValue: new RavenInterceptor() }],
})
export class AppModule {}
