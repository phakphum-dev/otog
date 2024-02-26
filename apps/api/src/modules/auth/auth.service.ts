import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { sha256 } from 'js-sha256'
import { PrismaService } from 'src/core/database/prisma.service'
import { v4 as uuidv4 } from 'uuid'

import { RefreshToken, User } from '@otog/database'

import { UserDTO } from '../user/dto/user.dto'
import { UserService } from '../user/user.service'

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async signup(data: Pick<User, 'username' | 'password' | 'showName'>) {
    return await this.userService.create(data)
  }

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } })
    if (!user) {
      throw new NotFoundException()
    }
    const hash = sha256.create()
    hash.update(password)
    if (user.password === hash.hex()) {
      ;(user.password as string | undefined) = undefined
      return user
    }
    return null
  }

  async login(user: UserDTO) {
    const token = await this.generateToken(user)
    return { token, user }
  }

  async findOneByRID(rid: string) {
    return this.prisma.refreshToken.findUnique({
      where: { id: rid },
    })
  }

  async reAccessToken(user: UserDTO) {
    const token = await this.generateToken(user)
    return { token, user }
  }

  async generateToken(user: UserDTO) {
    const payload = {
      id: user.id,
      username: user.username,
      showName: user.showName,
      role: user.role,
      rating: user.rating,
    }
    const jwtId = uuidv4()
    const accessToken = this.jwtService.sign(payload, {
      jwtid: jwtId,
    })

    const refreshToken = await this.generateRefreshToken(user, jwtId)
    return { accessToken, refreshToken }
  }

  async generateRefreshToken(user: UserDTO, jwtId: string) {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 2)
    const refreshToken = await this.prisma.refreshToken.create({
      data: { userId: user.id, jwtId, expiryDate, id: uuidv4() },
    })
    return { id: refreshToken.id, expiryDate: refreshToken.expiryDate }
  }

  async validateToken(refreshTokenId: string, jwtId: string) {
    const refreshToken = await this.findOneByRID(refreshTokenId)
    if (!refreshToken) {
      throw new NotFoundException()
    }
    if (!this.isRefreshTokenLinkedToToken(refreshToken, jwtId)) {
      throw new ForbiddenException('Access token and refresh token mismatch.')
    }
    if (!this.isRefreshTokenExpired(refreshToken)) {
      throw new ForbiddenException('Refresh token expired.')
    }
    if (!this.isRefreshTokenUsed(refreshToken)) {
      throw new ForbiddenException('refresh token used.')
    }
    await this.prisma.refreshToken.update({
      where: { id: refreshTokenId },
      data: { used: true },
    })
  }

  isRefreshTokenLinkedToToken(refreshToken: RefreshToken, jwtId: string) {
    if (!refreshToken) return false
    if (refreshToken.jwtId != jwtId) return false
    return true
  }

  isRefreshTokenExpired(refreshToken: RefreshToken) {
    const now = new Date()
    if (!refreshToken?.expiryDate) return false
    if (refreshToken.expiryDate < now) return false
    return true
  }

  isRefreshTokenUsed(refreshToken: RefreshToken) {
    if (refreshToken.used) return false
    return true
  }
}
