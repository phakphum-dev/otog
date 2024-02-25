import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtRefreshTokenStrategy } from './jwt.refreshtoken.strategy';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { PrismaService } from 'src/core/database/prisma.service';
import { environment } from 'src/env';

@Module({
  imports: [
    PassportModule,
    UserModule,
    JwtModule.register({
      secret: environment.JWT_SECRET,
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshTokenStrategy,
    PrismaService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
