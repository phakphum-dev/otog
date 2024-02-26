import { Controller, UseGuards } from '@nestjs/common'
import {
  TsRestHandler,
  nestControllerContract,
  tsRestHandler,
} from '@ts-rest/nest'
import { RolesGuard } from 'src/core/guards/roles.guard'

import { chatRouter } from '@otog/contract'

import { ChatService } from './chat.service'

const c = nestControllerContract(chatRouter)

@Controller()
@UseGuards(RolesGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @TsRestHandler(c.getChats)
  getChats() {
    return tsRestHandler(c.getChats, async ({ query: { limit, offset } }) => {
      const chats = await this.chatService.findAll(offset, limit)
      return { status: 200, body: chats }
    })
  }
}
