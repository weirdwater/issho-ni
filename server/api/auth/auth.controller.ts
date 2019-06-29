import { Body, Controller, Post, Req, UnauthorizedException, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthenticateClientDTO, AuthenticateUserDTO } from '../../../shared/dto';
import { isNone } from '../../../shared/fun';
import { Consumer } from './auth.helpers';
import { AuthService } from './auth.service';
import { AuthSession } from './authSession.entity';

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
