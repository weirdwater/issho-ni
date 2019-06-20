import { Controller, UsePipes, ValidationPipe, Post, Body, Req, UnauthorizedException, Inject, forwardRef, UseGuards, Session } from '@nestjs/common'
import { AuthenticateUserDTO } from './authenticateUser.dto'
import { AuthService } from './auth.service'
import { isNone } from 'shared/fun'
import { UserService } from '../user/user.service'
import { AuthSession } from './authSession.entity'
import { Request } from 'express'
import { AuthenticateClientDTO } from './authenticateClient.dto';
import { ClientService } from '../client/client.service';
import { AuthGuard } from '@nestjs/passport';
import { Consumer } from './auth.helpers';

@Controller('api/auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('user')
  @UsePipes(ValidationPipe)
  async authenticateUser(@Body() dto: AuthenticateUserDTO, @Req() req: Request): Promise<string> {
    const user = await this.authService.authenticateUser(dto)

    if (isNone(user)) {
      throw new UnauthorizedException()
    }

    const session = new AuthSession()
    session.user = user.v
    session.address = req.ip

    return this.authService.create(session)
  }

  @Post('client')
  @UsePipes(ValidationPipe)
  async authenticateClient(@Body() dto: AuthenticateClientDTO, @Req() req: Request): Promise<string> {
    const client = await this.authService.authenticateClient(dto)

    if (isNone(client)) {
      throw new UnauthorizedException()
    }

    const session = new AuthSession()
    session.client = client.v
    session.address = req.ip

    return this.authService.create(session)
  }

  @Post('close')
  @UseGuards(AuthGuard())
  deAuth(@Consumer() consumer: Consumer): Promise<boolean> {
    return this.authService.deAuth(consumer)
  }

}
