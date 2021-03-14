import { Body, Controller, Post } from '@nestjs/common';
import { SignUpDTO } from './auth.dto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('/auth/sign-up')
  public async signUp(@Body() payload: SignUpDTO): Promise<void> {
    this.authService.signUp(payload);
  }
}

export default AuthController;
