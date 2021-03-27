import { ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import { AuthGuard as PasswordGuard } from '@nestjs/passport';
import { ApiUnauthorizedException } from '~/common/exceptions';

@Injectable()
class Guard extends PasswordGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user) {
    if (err || !user) {
      throw err || new ApiUnauthorizedException(`The authentication fails`);
    }
    return user;
  }
}

export const AuthGuard = () => UseGuards(Guard);
export default AuthGuard;
