import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { parseDevice } from './utils/device';
import { hashToken } from './utils/token';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.getUserForAuth(email);
    if (!user) return null;

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) return null;

    return user;
  }

  async login(user: any, req: any) {

    console.log(user)
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.role.name),
      permissions: user.roles.flatMap((r) =>
        r.role.permissions.map((p) => p.permission.key),
      ),
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d' },
    );

    const { deviceType, os, browser } = parseDevice(req.headers['user-agent']);

    await this.prismaService.authSession.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        deviceType,
        os,
        browser,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string, req: any) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const tokenHash = hashToken(refreshToken);

      const session = await this.prismaService.authSession.findFirst({
        where: {
          userId: decoded.sub,
          tokenHash,
          isRevoked: false,
        },
      });

      if (!session) {
        throw new UnauthorizedException('Session revoked');
      }

      // Rotate
      await this.prismaService.authSession.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });

    
      const user = await this.usersService.getUserByIdForAuth(decoded.sub);
      if (!user) throw new UnauthorizedException();

      return this.login(user, req);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    await this.prismaService.authSession.updateMany({
      where: {
        tokenHash: hashToken(refreshToken),
      },
      data: { isRevoked: true },
    });
  }

  async logoutAll(userId: string) {
    await this.prismaService.authSession.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}
