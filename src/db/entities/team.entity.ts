import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import AccountEntity from './account.entity';
import { IEntity } from './entity.interface';

@Entity('teams')
export class TeamEntity extends IEntity {
  @Column({ type: 'jsonb', name: 'enc_key' })
  encKey: Record<string, any>;

  @Column({ type: 'jsonb', name: 'enc_overview' })
  encOverview: Record<string, any>;

  @Column({ type: 'uuid', name: 'creator_account_id' })
  public creatorAccountId: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({
    name: 'creator_account_id',
    referencedColumnName: 'id',
  })
  public creatorAccount?: AccountEntity;
}

export default TeamEntity;
