import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

export type ApiPropertiesError = { [key: string]: [string] };
export type ApiMessageError = string;

export type ApiError = {
  type: string;
  message?: ApiMessageError;
  properties?: ApiPropertiesError;
};

export class ApiException extends HttpException {
  private error: ApiError;

  constructor(error: ApiError, status: number) {
    super('Api Error', status);

    this.error = error;
  }

  getError(): ApiError {
    return this.error;
  }
}

@Catch(ApiException)
export default class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: ApiException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    response.status(status).json({
      error: exception.getError(),
      statusCode: status,
    });
  }
}
