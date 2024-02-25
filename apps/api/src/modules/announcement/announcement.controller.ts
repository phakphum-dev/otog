import { Controller, UseGuards } from '@nestjs/common';
import { AccessState, Role } from 'src/core/constants';
import { OfflineAccess } from 'src/core/decorators/offline-mode.decorator';
import { Roles } from 'src/core/decorators/roles.decorator';
import { User } from 'src/core/decorators/user.decorator';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { UserDTO } from '../user/dto/user.dto';
import { AnnouncementService } from './announcement.service';

import {
  // NestControllerInterface,
  // NestRequestShapes,
  // TsRest,
  TsRestHandler,
  nestControllerContract,
  tsRestHandler,
} from '@ts-rest/nest';

import { z } from 'zod';
import { announcementRouter } from '@otog/contract';

const c = nestControllerContract(announcementRouter);
// type RequestShapes = NestRequestShapes<typeof c>;

@Controller()
@UseGuards(RolesGuard)
// implements NestControllerInterface<typeof c>
export class AnnouncementController {
  constructor(private announcementService: AnnouncementService) {}

  @TsRestHandler(c.getAnnouncements)
  @OfflineAccess(AccessState.Authenticated)
  getAnnouncements(@User() user: UserDTO) {
    return tsRestHandler(c.getAnnouncements, async () => {
      const announcements =
        user?.role === Role.Admin
          ? await this.announcementService.findAll()
          : await this.announcementService.findShown();
      return { status: 200, body: announcements };
    });
  }

  @TsRestHandler(c.createAnnouncement)
  @Roles(Role.Admin)
  createAnnouncement() {
    return tsRestHandler(c.createAnnouncement, async ({ body }) => {
      if (!body.value) {
        return { status: 400, body: { message: 'No value is sent' } };
      }
      const announcement = await this.announcementService.create(body.value);
      return { status: 201, body: announcement };
    });
  }

  @TsRestHandler(c.getContestAnnouncments)
  @OfflineAccess(AccessState.Authenticated)
  getContestAnnouncments(@User() user: UserDTO) {
    return tsRestHandler(
      c.getContestAnnouncments,
      async ({ params: { contestId } }) => {
        const id = z.number().parse(contestId);
        const announcements =
          user?.role === Role.Admin
            ? await this.announcementService.findAllWithContestId(id)
            : await this.announcementService.findShownWithContestId(id);
        return { status: 200, body: announcements };
      },
    );
  }

  @TsRestHandler(c.createContestAnnouncement)
  @Roles(Role.Admin)
  createContestAnnouncement() {
    return tsRestHandler(
      c.createContestAnnouncement,
      async ({ params: { contestId }, body }) => {
        const id = z.number().parse(contestId);
        if (!body.value) {
          return { status: 400, body: { message: 'No value is sent' } };
        }
        const announcement = await this.announcementService.create(
          body.value,
          id,
        );
        return { status: 201, body: announcement };
      },
    );
  }

  @TsRestHandler(c.deleteAnnouncement)
  @Roles(Role.Admin)
  deleteAnnouncement() {
    return tsRestHandler(
      c.deleteAnnouncement,
      async ({ params: { announcementId } }) => {
        const id = z.number().parse(announcementId);
        const announcement = await this.announcementService.delete(id);
        return { status: 200, body: announcement };
      },
    );
  }

  @TsRestHandler(c.showAnnouncement)
  @Roles(Role.Admin)
  showAnnouncement() {
    return tsRestHandler(
      c.showAnnouncement,
      async ({ params: { announcementId }, body: { show } }) => {
        const id = z.number().parse(announcementId);
        const announcement =
          await this.announcementService.updateAnnouncementShow(id, show);
        return { status: 200, body: announcement };
      },
    );
  }

  @TsRestHandler(c.updateAnnouncement)
  @Roles(Role.Admin)
  updateAnnouncement() {
    return tsRestHandler(
      c.updateAnnouncement,
      async ({ params: { announcementId }, body }) => {
        const id = z.number().parse(announcementId);
        const announcement = await this.announcementService.updateAnnounce(
          id,
          // TODO: fix me
          body as any,
        );
        return { status: 200, body: announcement };
      },
    );
  }
}
