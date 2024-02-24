import { Role } from 'src/core/constants';
import { UserDTO } from 'src/modules/user/dto/user.dto';

export class AuthResDTO {
  user?: UserDTO;

  accessToken?: string;
}

export class JwtPayloadDTO {
  id?: number;

  username?: string;

  showName?: string;

  role?: Role;

  rating?: number | null;

  iat?: number;

  exp?: number;

  jti?: string;
}
