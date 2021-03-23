import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  SignUpPayload,
  SignInPayload,
  StartSessionPayload,
  SignInResponse,
  StartSessionResponse,
  VerifySessionPayload,
  VerifySessionResponse,
  GetCsrfTokenResponse,
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

  @Post('sign-in')
  @ApiCreatedResponse({ type: SignInResponse })
  @ApiNotFoundResponse()
  public async signIn(@Body() payload: SignInPayload): Promise<SignInResponse> {
    return this.authService.signIn(payload);
  }

  @Post('start-session')
  @ApiCreatedResponse({ type: StartSessionResponse })
  @ApiNotFoundResponse()
  public async startSession(
    @Body() payload: StartSessionPayload
  ): Promise<StartSessionResponse> {
    return this.authService.startSession(payload);
  }

  @Post('verify')
  @ApiNotFoundResponse()
  public async verify(
    @Body() payload: VerifySessionPayload
  ): Promise<VerifySessionResponse> {
    return this.authService.verifySession(payload);
  }

  @Get('/csrf-token')
  @ApiOkResponse({ type: GetCsrfTokenResponse })
  public getCsrfToken(@Req() req: Request): GetCsrfTokenResponse {
    return {
      'X-CSRF-TOKEN': req.csrfToken(),
    };
  }
}

export default AuthController;
