import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  SignUpPayload,
  SessionCreatePayload,
  SessionCreateResponse,
  SessionStartPayload,
  SessionStartResponse,
  SessionVerifyPayload,
  SessionVerifyResponse,
  GetCsrfTokenResponse,
  RefreshTokenResponse,
} from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('/auth')
@Controller('/auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @ApiCreatedResponse()
  @ApiNotFoundResponse()
  public async signUp(@Body() payload: SignUpPayload): Promise<void> {
    await this.authService.signUp(payload);
  }

  @Post('/sessions')
  @ApiCreatedResponse({ type: SessionCreateResponse })
  @ApiNotFoundResponse()
  public async signIn(
    @Body() payload: SessionCreatePayload
  ): Promise<SessionCreateResponse> {
    return this.authService.createSession(payload);
  }

  @Post('/sessions/:sessionUuid/start')
  @ApiCreatedResponse({ type: SessionStartResponse })
  @ApiNotFoundResponse()
  public async startSession(
    @Param('sessionUuid') sessionUuid: string,
    @Body() payload: SessionStartPayload
  ): Promise<SessionStartResponse> {
    return this.authService.startSession(sessionUuid, payload);
  }

  @Post('/session/:sessionUuid/verify')
  @ApiNotFoundResponse()
  public async verify(
    @Param('sessionUuid') sessionUuid: string,
    @Body() payload: SessionVerifyPayload
  ): Promise<SessionVerifyResponse> {
    return this.authService.verifySession(sessionUuid, payload.deviceUuid);
  }

  @Get('/csrf-token')
  @ApiOkResponse({ type: GetCsrfTokenResponse })
  public getCsrfToken(@Req() req: Request): GetCsrfTokenResponse {
    return {
      'X-CSRF-TOKEN': req.csrfToken(),
    };
  }

  @Post('/sessions/:sessionUuid/refresh-token')
  @ApiCreatedResponse({ type: RefreshTokenResponse })
  public refreshToken(
    @Param('sessionUuid') sessionUuid: string
  ): Promise<RefreshTokenResponse> {
    return this.authService.refreshToken(sessionUuid);
  }
}

export default AuthController;
