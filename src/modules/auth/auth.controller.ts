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
} from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('/auth')
@Controller()
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('/auth/sign-up')
  @ApiCreatedResponse()
  @ApiNotFoundResponse()
  public async signUp(@Body() payload: SignUpPayload): Promise<void> {
    this.authService.signUp(payload);
  }

  @Post('/auth/sign-in')
  @ApiCreatedResponse({ type: SignInResponse })
  @ApiNotFoundResponse()
  public async signIn(@Body() payload: SignInPayload): Promise<SignInResponse> {
    return this.authService.signIn(payload);
  }

  @Post('/auth/start-session')
  @ApiCreatedResponse({ type: StartSessionResponse })
  @ApiNotFoundResponse()
  public async startSession(
    @Body() payload: StartSessionPayload
  ): Promise<StartSessionResponse> {
    return this.authService.startSession(payload);
  }
}

export default AuthController;
