import { FindConditions, ObjectID } from 'typeorm';

export type Criteria<T> =
  | string
  | string[]
  | number
  | number[]
  | Date
  | Date[]
  | ObjectID
  | ObjectID[]
  | FindConditions<T>;

export default Criteria;
