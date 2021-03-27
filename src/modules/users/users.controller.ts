import { Controller, Get } from '@nestjs/common';
import AuthGuard from '~/modules/auth/auth.guard';
import CurrentUser from '~/modules/auth/current-user';
import UsersService from './users.service';

@Controller()
export default class UsersController {
  public constructor(private readonly usersService: UsersService) {}

  @AuthGuard()
  @Get('/me')
  public getMe(@CurrentUser() user) {
    return this.usersService.findOne({
      select: ['id', 'name', 'avatarUrl'],
      where: { id: user.id },
    });
  }
}
