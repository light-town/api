import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import {
  SignUpPayload,
  SignInPayload,
  StartSessionPayload,
  SignInResponse,
  StartSessionResponse,
  VerifySessionPayload,
  VerifySessionResponse,
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
}

export default AuthController;
