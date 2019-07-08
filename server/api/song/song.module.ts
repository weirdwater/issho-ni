import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SongController } from './song.controller';
import { SongService } from './song.service';
import { Song } from './song.entity';
import { SongComponent } from './songComponent.entity';
import { Reference } from './referenceComponent.entity';
import { Lyric } from './lyricComponent.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'bearer', property: 'consumer' }),
    TypeOrmModule.forFeature([Song]),
    TypeOrmModule.forFeature([SongComponent]),
    TypeOrmModule.forFeature([Lyric]),
    TypeOrmModule.forFeature([Reference]),
    AuthModule,
  ],
  controllers: [SongController],
  providers: [SongService],
})
export class SongModule {}
