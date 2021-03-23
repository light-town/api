import { IsString as Validator } from 'class-validator';

export const IsString = () =>
  Validator({ message: `The $property must be a string` });

export default IsString;
