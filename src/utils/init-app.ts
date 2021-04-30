import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
import csurf from 'csurf';
import cookieParser from 'cookie-parser';
import ResponseFormatInterceptor from '~/common/response-format.interceptor';
import WsAdapter from '~/common/ws-adapter';
import ValidationPipe from '~/common/validation/pipe';
import ApiExceptionFilter from '~/common/api-exception-filter';

dotenv.config();

export const initApp = (
  app: INestApplication,
  { useCors = false, useCsurf = false, usePrefix = false, useWS = false } = {}
) => {
  app.use(cookieParser());

  if (useCors)
    app.enableCors({
      credentials: true,
      origin: process.env.FRONTEND_URL,
    });

  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new ResponseFormatInterceptor());
  app.useGlobalPipes(new ValidationPipe());

  if (useCsurf)
    app.use(
      csurf({
        cookie: true,
        value: req => req?.headers['x-csrf-token'] || req?.cookies['_csrf'],
      })
    );

  if (usePrefix) app.setGlobalPrefix('/v1/api');

  if (useWS) app.useWebSocketAdapter(new WsAdapter(app));

  return app;
};

export default initApp;
