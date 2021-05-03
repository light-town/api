import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTeamMember = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const httpContext = ctx.switchToHttp();
    const req = httpContext.getRequest();

    return req.teamMember;
  }
);

export default CurrentTeamMember;
