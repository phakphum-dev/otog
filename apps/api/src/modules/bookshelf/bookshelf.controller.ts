import { Controller, UseGuards } from '@nestjs/common'
import {
  TsRestHandler,
  nestControllerContract,
  tsRestHandler,
} from '@ts-rest/nest'
import { AccessState, Role } from 'src/core/constants'
import { OfflineAccess } from 'src/core/decorators/offline-mode.decorator'
import { Roles } from 'src/core/decorators/roles.decorator'
import { User } from 'src/core/decorators/user.decorator'
import { RolesGuard } from 'src/core/guards/roles.guard'
import { z } from 'zod'

import { announcementRouter, bookshelfRouter } from '@otog/contract'

import { UserDTO } from '../user/dto/user.dto'
import { BookshelfService } from './bookshelf.service'

const c = nestControllerContract(bookshelfRouter)

@Controller()
@UseGuards(RolesGuard)
export class BookshelfController {
  constructor(private bookshelfService: BookshelfService) {}

  @TsRestHandler(c.getBookshelves, { jsonQuery: true })
  @OfflineAccess(AccessState.Authenticated)
  getBookshelves(@User() user: UserDTO) {
    return tsRestHandler(c.getBookshelves, async ({}) => {
      return { status: 200, body: await this.bookshelfService.findAll() }
    })
  }

  @TsRestHandler(c.getProblemsOnBookshelf, { jsonQuery: true })
  @OfflineAccess(AccessState.Authenticated)
  getProblemsOnBookshelf(@User() user: UserDTO, bookshelfId: number) {
    return tsRestHandler(c.getProblemsOnBookshelf, async ({}) => {
      return {
        status: 200,
        body: await this.bookshelfService.findProblemsOnBookshelf(bookshelfId),
      }
    })
  }
}
