import { IsNotEmpty as Validator } from 'class-validator';

export const IsNotEmpty = () =>
  Validator({ message: `The $property must be a non-empty string` });

export default IsNotEmpty;
