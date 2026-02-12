import {
  Controller,
  Post,
  UseGuards,
  Request,
  Res,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { FastifyReply } from 'fastify';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) reply: FastifyReply) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
      req,
    );

    reply.setCookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
    });

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
    });

    return { success: true };
  }

  @Post('refresh')
  @Public()
  async refresh(
    @Request() req,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      reply.clearCookie('accessToken', { path: '/' });
      reply.clearCookie('refreshToken', { path: '/' });
      throw new UnauthorizedException('No refresh token');
    }

    try {
      const { accessToken, refreshToken: newRefreshToken } =
        await this.authService.refresh(refreshToken, req);

      reply.setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        path: '/',
      });

      reply.setCookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        path: '/',
      });

      return { success: true };
    } catch (err) {
      reply.clearCookie('accessToken', { path: '/' });
      reply.clearCookie('refreshToken', { path: '/' });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Public()
  @Post('logout')
  async logout(
    @Request() req,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    reply.clearCookie('accessToken', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/' });

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(@Request() req) {
    await this.authService.logoutAll(req.user.sub);
    return { success: true };
  }
}
