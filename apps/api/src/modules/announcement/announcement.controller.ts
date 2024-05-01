import { Controller, UseGuards } from '@nestjs/common'
import {
  // NestControllerInterface,
  // NestRequestShapes,
  // TsRest,
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

import { announcementRouter } from '@otog/contract'

import { UserDTO } from '../user/dto/user.dto'
import { AnnouncementService } from './announcement.service'

const c = nestControllerContract(announcementRouter)
// type RequestShapes = NestRequestShapes<typeof c>;

@Controller()
@UseGuards(RolesGuard)
// implements NestControllerInterface<typeof c>
export class AnnouncementController {
  constructor(private announcementService: AnnouncementService) {}

  @TsRestHandler(c.getAnnouncements, { jsonQuery: true })
  @OfflineAccess(AccessState.Authenticated)
  getAnnouncements(@User() user: UserDTO) {
    return tsRestHandler(c.getAnnouncements, async ({ query }) => {
      if (!query.show && user?.role !== Role.Admin) {
        return {
          status: 403,
          body: { message: 'Only Admin can access hidden announcements' },
        }
      }
      const announcements = await (() => {
        if (query.contestId) {
          const contestId = z.number().parse(query.contestId)
          if (query.show) {
            return this.announcementService.findShownWithContestId(contestId)
          }
          return this.announcementService.findAllWithContestId(contestId)
        }
        if (query.show) {
          return this.announcementService.findShown()
        }
        return this.announcementService.findAll()
      })()
      return {
        status: 200,
        body: announcements.map((announcement) => ({
          ...announcement,
          value: JSON.stringify(announcement.value),
        })),
      }
    })
  }

  @TsRestHandler(c.createAnnouncement, { jsonQuery: true })
  @Roles(Role.Admin)
  createAnnouncement() {
    return tsRestHandler(c.createAnnouncement, async ({ body }) => {
      if (!body.value) {
        return { status: 400, body: { message: 'No value is sent' } }
      }
      const announcement = await this.announcementService.create(body.value)
      return {
        status: 201,
        body: { ...announcement, value: JSON.stringify(announcement.value) },
      }
    })
  }

  @TsRestHandler(c.deleteAnnouncement, { jsonQuery: true })
  @Roles(Role.Admin)
  deleteAnnouncement() {
    return tsRestHandler(
      c.deleteAnnouncement,
      async ({ params: { announcementId } }) => {
        const id = z.number().parse(announcementId)
        const announcement = await this.announcementService.delete(id)
        return {
          status: 200,
          body: { ...announcement, value: JSON.stringify(announcement.value) },
        }
      }
    )
  }

  @TsRestHandler(c.showAnnouncement, { jsonQuery: true })
  @Roles(Role.Admin)
  showAnnouncement() {
    return tsRestHandler(
      c.showAnnouncement,
      async ({ params: { announcementId }, body: { show } }) => {
        const id = z.number().parse(announcementId)
        const announcement =
          await this.announcementService.updateAnnouncementShow(id, show)
        return {
          status: 200,
          body: { ...announcement, value: JSON.stringify(announcement.value) },
        }
      }
    )
  }

  @TsRestHandler(c.updateAnnouncement, { jsonQuery: true })
  @Roles(Role.Admin)
  updateAnnouncement() {
    return tsRestHandler(
      c.updateAnnouncement,
      async ({ params: { announcementId }, body }) => {
        const id = z.number().parse(announcementId)
        const announcement = await this.announcementService.updateAnnounce(
          id,
          body
        )
        return {
          status: 200,
          body: { ...announcement, value: JSON.stringify(announcement.value) },
        }
      }
    )
  }
}
