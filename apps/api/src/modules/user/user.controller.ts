import { Controller, UseGuards } from '@nestjs/common';
import { Role } from 'src/core/constants';
import { Roles } from 'src/core/decorators/roles.decorator';
import { User } from 'src/core/decorators/user.decorator';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { UserService } from './user.service';
import {
  TsRestHandler,
  nestControllerContract,
  tsRestHandler,
} from '@ts-rest/nest';
import { z } from 'zod';
import { UserDTO } from './dto/user.dto';
import { userRouter } from '@otog/contract';

const c = nestControllerContract(userRouter);

@Controller()
@UseGuards(RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @TsRestHandler(c.getUsers)
  @Roles(Role.Admin)
  getUsers() {
    return tsRestHandler(c.getUsers, async () => {
      const users = await this.userService.findAll();
      return { status: 200, body: users };
    });
  }

  @TsRestHandler(c.getUsers)
  getOnlineUsers() {
    return tsRestHandler(c.getUsers, async () => {
      const users = await this.userService.onlineUser();
      return { status: 200, body: users };
    });
  }

  @TsRestHandler(c.getUserProfile)
  getUserProfile() {
    return tsRestHandler(c.getUserProfile, async ({ params: { userId } }) => {
      const id = z.coerce.number().parse(userId);
      const user = await this.userService.getUserProfileById(id);
      if (!user) {
        return { status: 404, body: { message: 'Not Found' } };
      }
      return { status: 200, body: user };
    });
  }

  @TsRestHandler(c.updateUser)
  @Roles(Role.Admin)
  updateUser() {
    return tsRestHandler(c.updateUser, async ({ params: { userId }, body }) => {
      const id = z.coerce.number().parse(userId);
      const user = await this.userService.updateUser(id, body);
      return { status: 200, body: user };
    });
  }

  @TsRestHandler(c.updateShowName)
  @Roles(Role.Admin, Role.User)
  updateShowName(@User() user: UserDTO) {
    return tsRestHandler(
      c.updateShowName,
      async ({ params: { userId }, body }) => {
        const id = z.coerce.number().parse(userId);
        if (user.role !== Role.Admin && user.id !== id) {
          return { status: 403, body: { message: 'Forbidden' } };
        }
        const showName = await this.userService.updateShowNameById(
          body.showName,
          id,
        );
        return { status: 200, body: showName };
      },
    );
  }
}
