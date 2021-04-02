import { Column, Entity } from 'typeorm';
import { IEntity } from './entity.interface';

@Entity('session_verification_stage')
export class SessionVerificationStageEntity extends IEntity {
  @Column({ length: 256, unique: true })
  public name: string;
}

export default SessionVerificationStageEntity;
