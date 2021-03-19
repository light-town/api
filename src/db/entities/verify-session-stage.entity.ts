import { Column, Entity } from 'typeorm';
import { IEntity } from './entity.interface';

@Entity('verify_session_stages')
export class VerifySessionStageEntity extends IEntity {
  @Column({ length: 256, unique: true })
  public name: string;
}

export default VerifySessionStageEntity;
