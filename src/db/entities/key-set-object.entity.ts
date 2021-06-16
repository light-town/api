import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { IEntity } from './entity.interface';
import VaultEntity from './vault.entity';
import KeySetEntity from './key-set.entity';
import TeamEntity from './team.entity';

@Entity('key_set_objects')
export class KeySetObjectEntity extends IEntity {
  @Column({ type: 'uuid', name: 'key_set_id' })
  public keySetId: string;

  @ManyToOne(() => KeySetEntity)
  @JoinColumn({
    name: 'key_set_id',
    referencedColumnName: 'id',
  })
  public keySet?: KeySetEntity;

  @Column({ type: 'uuid', name: 'vault_id', nullable: true })
  public vaultId?: string;

  @ManyToOne(() => VaultEntity)
  @JoinColumn({
    name: 'vault_id',
    referencedColumnName: 'id',
  })
  public vault?: VaultEntity;

  @Column({ type: 'uuid', name: 'team_id', nullable: true })
  public teamId?: string;

  @ManyToOne(() => TeamEntity)
  @JoinColumn({
    name: 'team_id',
    referencedColumnName: 'id',
  })
  public team?: TeamEntity;
}

export default KeySetObjectEntity;
