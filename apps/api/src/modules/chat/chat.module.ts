import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { environment } from 'src/env'

import { ChatController } from './chat.controller'
import { ChatGateway } from './chat.gateway'
import { ChatService } from './chat.service'

@Module({
  imports: [
    JwtModule.register({
      secret: environment.JWT_SECRET,
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
