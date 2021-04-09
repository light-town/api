import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentAccount = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => ctx.getArgByIndex(0).user
);

export default CurrentAccount;
