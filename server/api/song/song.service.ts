import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Song } from './song.entity';
import { LyricComponentDTO } from 'shared/dto';
import { Lyric } from './lyricComponent.entity';
import { Reference } from './referenceComponent.entity';

@Injectable()
export class SongService {

  constructor(
    @InjectRepository(Song) private readonly songRepository: Repository<Song>,
    @InjectRepository(Lyric) private readonly lyricRepository: Repository<Lyric>,
    @InjectRepository(Reference) private readonly referenceRepository: Repository<Reference>,
  ) {}

  findAll(): Promise<Song[]> {
    return this.songRepository.find()
  }

  find(s: Partial<Song>): Promise<Song> {
    return this.songRepository.findOne(s)
  }

  save(s: Song): Promise<Song> {
    return this.songRepository.save(s)
  }

  saveLyricComponent(l: Lyric) {
    return this.lyricRepository.save(l)
  }

  saveReferenceComponent(r: Reference) {
    return this.referenceRepository.save(r)
  }

}
