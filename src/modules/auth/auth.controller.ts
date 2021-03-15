import { Body, Controller, Post } from '@nestjs/common';
import { SignUpDTO, SignInDTO } from './auth.dto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('/auth/sign-up')
  public async signUp(@Body() payload: SignUpDTO): Promise<void> {
    this.authService.signUp(payload);
  }

  @Post('/auth/sign-in')
  public async signIn(@Body() payload: SignInDTO): Promise<any> {
    return this.authService.signIn(payload);
  }
}

export default AuthController;
