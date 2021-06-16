import * as uuid from 'uuid';
import { PipeTransform, Injectable } from '@nestjs/common';
import { ApiBadRequestException } from '../exceptions';

export interface ParseUUIDOptions {
  optional?: boolean;
}

@Injectable()
export default class ParseUUIDPipe implements PipeTransform {
  public constructor(private readonly options?: ParseUUIDOptions) {}

  public transform(value: any) {
    const validated = this.validate(value);

    if (validated) return value;
    else if (this.options?.optional) return value;

    throw new ApiBadRequestException(
      'The value passed as UUID is not a string'
    );
  }

  private validate(value: any): boolean {
    return uuid.validate(value) && uuid.version(value) === 4;
  }
}
