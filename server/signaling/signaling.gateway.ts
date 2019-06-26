import { SubscribeMessage, WebSocketGateway, OnGatewayConnection } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { SocketGuard } from './socket.guard';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class SignalingGateway {

  @SubscribeMessage('events')
  @UseGuards(SocketGuard)
  handleMessage(socket: Socket, payload: any): string {
    return payload;
  }

}
