import { IsEnum as Validator } from 'class-validator';

export const IsEnum = entity =>
  Validator(entity, { message: 'The $property must be a valid enum value' });

export default IsEnum;
