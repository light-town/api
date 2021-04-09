import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { IEntity } from './entity.interface';
import AccountEntity from './account.entity';
import TeamEntity from './team.entity';

@Entity('key_sets')
export class KeySetEntity extends IEntity {
  @Column({ name: 'public_key', nullable: true })
  public publicKey: string;

  @Column({ type: 'jsonb', name: 'enc_private_key', nullable: true })
  public encPrivateKey: Record<string, any>;

  @Column({ type: 'jsonb', name: 'enc_symmetric_key' })
  public encSymmetricKey: Record<string, any>;

  @Column({ default: false })
  public isPrimary: boolean;

  @Column({ type: 'uuid', name: 'creator_account_id' })
  public creatorAccountId: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({
    name: 'creator_account_id',
    referencedColumnName: 'id',
  })
  public creatorAccount?: AccountEntity;

  @Column({ type: 'uuid', name: 'owner_account_id', nullable: true })
  public ownerAccountId?: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({
    name: 'owner_account_id',
    referencedColumnName: 'id',
  })
  public ownerAccount?: AccountEntity;

  @Column({ type: 'uuid', name: 'owner_team_id', nullable: true })
  public ownerTeamId?: string;

  @ManyToOne(() => TeamEntity)
  @JoinColumn({
    name: 'owner_team_id',
    referencedColumnName: 'id',
  })
  public ownerTeam?: TeamEntity;
}

export default KeySetEntity;
