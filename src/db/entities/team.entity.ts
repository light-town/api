import { Column, Entity } from 'typeorm';
import { IEntity } from './entity.interface';

@Entity('teams')
export class TeamEntity extends IEntity {
  @Column({ type: 'jsonb', name: 'enc_key' })
  encKey: Record<string, any>;

  @Column({ type: 'jsonb', name: 'enc_metadata' })
  encMetadata: Record<string, any>;
}

export default TeamEntity;
