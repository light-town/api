import { PipeTransform, Injectable } from '@nestjs/common';
import { ApiBadRequestException } from '../exceptions';

export interface ParseBoolOptions {
  optional?: boolean;
}

@Injectable()
export default class ParseBoolPipe implements PipeTransform {
  public constructor(private readonly options?: ParseBoolOptions) {}

  public transform(value: any) {
    const validated = this.validate(value);

    if (!validated && !this.options?.optional)
      throw new ApiBadRequestException(
        'The value passed as Bool is not a bool'
      );

    return value === 'true';
  }

  private validate(value: any): boolean {
    return ['true', 'false'].includes(value);
  }
}
