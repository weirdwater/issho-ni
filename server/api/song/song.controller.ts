import {
  Controller,
  ClassSerializerInterceptor,
  UseInterceptors,
  Get,
  Param,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { SongService } from './song.service';
import { Song } from './song.entity';
import { AuthGuard } from '@nestjs/passport';
import { Consumer, isClient } from '../auth/auth.helpers';
import { CreateSongDTO } from '../../../shared/dto';
import { Lyric } from './lyricComponent.entity';
import { Reference } from './referenceComponent.entity';

@Controller('api/song')
@UseInterceptors(ClassSerializerInterceptor)
export class SongController {

  constructor(private readonly songService: SongService) {}

  @Get()
  findAll(): Promise<Song[]> {
    return this.songService.findAll()
  }

  @Get(':id')
  @UsePipes(ValidationPipe)
  async getSong(@Param('id') id: number): Promise<Song> {
    const song = await this.songService.find({ id })

    if (song === undefined) {
      throw new NotFoundException('Song not found')
    }

    return song
  }

  @Post()
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async addSong(@Body() data: CreateSongDTO, @Consumer() consumer: Consumer): Promise<Song> {
    if (isClient(consumer)) {
      throw new ForbiddenException()
    }

    const song = new Song()
    song.title = data.title
    song.artist = data.artist
    song.owner = consumer.v

    const pSong = await this.songService.save(song)

    await Promise.all<Lyric|Reference>(data.components.map((c, i) => {
      if (c.kind === 'lyric') {
        const l = new Lyric()
        l.id = c.id
        l.lines = c.lines
        l.name = c.name
        l.song = pSong
        l.order = i
        return this.songService.saveLyricComponent(l)
      }
      const r = new Reference()
      r.id = c.id
      r.componentId = c.componentId
      r.name = c.name
      r.song = pSong
      r.order = i
      return this.songService.saveReferenceComponent(r)
    }))

    return this.songService.find({ id: pSong.id })
  }

}
