import { Controller, Get, UseGuards, NotFoundException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { servers } from './ice-servers'
import { IceServer } from './ice-server'
import { ConfigService } from '../../config/config.service'
import { isNone } from '../../../shared/fun'

@Controller('api/ice-server')
export class IceServerController {

  constructor(private readonly configService: ConfigService) {}

  @Get()
  @UseGuards(AuthGuard())
  getServers(): IceServer[] {
    if (isNone(this.configService.turnUsername) || isNone(this.configService.turnCredential)) {
      throw new NotFoundException()
    }

    return servers({ username: this.configService.turnUsername.v, credential: this.configService.turnCredential.v})
  }

}
