import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiForbiddenException } from '~/common/exceptions';
import TeamMembersService from './team-members.service';

@Injectable()
export class CurrentTeamMemberInterceptor implements NestInterceptor {
  public constructor(private readonly teamMembersService: TeamMembersService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest();

    const accountId: string = req?.user?.id;
    const teamId: string =
      req?.params?.teamUuid ?? req?.query?.teamUuid ?? req?.body?.teamUuid;

    const teamMember = await this.teamMembersService.getTeamMember({
      accountId,
      teamId,
    });

    if (!teamMember)
      throw new ApiForbiddenException(`The user is not a member of the team`);

    req.teamMember = teamMember;

    return next.handle();
  }
}
