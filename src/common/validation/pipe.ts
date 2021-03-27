import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ApiValidationException } from '../exceptions';

@Injectable()
export default class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) return value;

    const object = plainToClass(metatype, value);

    const errors: ValidationError[] = await validate(object);

    if (errors.length > 0)
      throw new ApiValidationException(
        errors.reduce(
          (prev, val) => ({
            ...prev,
            [val.property]: Object.values(val.constraints),
          }),
          {}
        )
      );

    return value;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
