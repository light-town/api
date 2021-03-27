import { HttpStatus } from '@nestjs/common';
import { ApiException, ApiPropertiesError } from './api-exception-filter';

export class ApiValidationException extends ApiException {
  constructor(properties?: ApiPropertiesError) {
    super({ type: 'Validation Error', properties }, HttpStatus.BAD_REQUEST);
  }
}

export class ApiNotFoundException extends ApiException {
  constructor(message?: string) {
    super({ type: 'Not Found', message }, HttpStatus.NOT_FOUND);
  }
}

export class ApiForbiddenException extends ApiException {
  constructor(message?: string) {
    super({ type: 'Forbidden', message }, HttpStatus.FORBIDDEN);
  }
}

export class ApiUnauthorizedException extends ApiException {
  constructor(message?: string) {
    super({ type: 'Unauthorized', message }, HttpStatus.UNAUTHORIZED);
  }
}
