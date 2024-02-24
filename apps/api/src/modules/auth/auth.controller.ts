import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthResDTO } from './dto/auth.dto';
import { JwtRefreshTokenAuthGuard } from '../../core/guards/jwt-refreshtoken-auth.guard';
import { LocalAuthGuard } from '../../core/guards/local-auth.guard';
import { Public } from '../../core/decorators/isPublic.decorator';
import { User } from 'src/core/decorators/user.decorator';
import { UserDTO } from '../user/dto/user.dto';
import { OfflineAccess } from 'src/core/decorators/offline-mode.decorator';
import { AccessState } from 'src/core/constants';
import { configuration } from 'src/core/config/configuration';
import {
  TsRestHandler,
  nestControllerContract,
  tsRestHandler,
} from '@ts-rest/nest';
import { authRouter } from 'src/api';

const c = nestControllerContract(authRouter);

@Public()
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @TsRestHandler(c.register)
  register() {
    return tsRestHandler(c.register, async ({ body }) => {
      const result = await this.authService.signup(body);
      return { status: 201, body: { message: result.message } };
    });
  }

  @UseGuards(LocalAuthGuard)
  @OfflineAccess(AccessState.Public)
  @Post('/login')
  async login(@User() userData: UserDTO, @Res() res: Response) {
    const { token, user } = await this.authService.login(userData);
    const authResDTO = new AuthResDTO();
    authResDTO.user = user;
    authResDTO.accessToken = token.accessToken;
    return res
      .cookie('RID', token.refreshToken.id, {
        httpOnly: true,
        domain: configuration().domain,
        expires: token.refreshToken.expiryDate ?? undefined,
      })
      .json(authResDTO);
  }

  @UseGuards(JwtRefreshTokenAuthGuard)
  @OfflineAccess(AccessState.Public)
  @Get('/refresh/token')
  async refreshToken(@User() userData: UserDTO, @Res() res: Response) {
    const { token, user } = await this.authService.reAccessToken(userData);
    const authResDTO = new AuthResDTO();
    authResDTO.user = user;
    authResDTO.accessToken = token.accessToken;
    return res
      .cookie('RID', token.refreshToken.id, {
        httpOnly: true,
        domain: configuration().domain,
        expires: token.refreshToken.expiryDate ?? undefined,
      })
      .json(authResDTO);
  }
}
