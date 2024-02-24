import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { UserDTO } from '../user/dto/user.dto';
import { userList } from 'src/utils';

@WebSocketGateway({ cors: true })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}
  @WebSocketServer() server!: Server;

  private logger: Logger = new Logger('MessageGateway');

  @SubscribeMessage('chat-server')
  async receiveMsg(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: string,
  ) {
    const user: UserDTO = userList.get(client.id);
    if (!user) return client.disconnect();

    const chat = await this.chatService.create(message, user.id);
    this.server.sockets.emit('chat', [
      chat.id,
      chat.message,
      chat.creationDate,
      [user.id, user.showName, user.rating],
    ]);
  }

  public afterInit(): void {
    return this.logger.log('ChatWebSocket initialized');
  }

  public handleDisconnect(client: Socket): void {
    userList.delete(client.id);
    this.server.emit('online');
    return this.logger.log(`Client disconnected: ${client.id}`);
  }

  public handleConnection(client: Socket): void {
    const { token } = client.handshake.auth;
    const userInfo = this.jwtService.decode(token);
    const user = new UserDTO(userInfo);
    userList.set(client.id, user);
    this.server.emit('online');
    return this.logger.log(`Client connected: ${client.id}`);
  }
}
