import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { IEntity } from './entity.interface';
import UserEntity from './user.entity';

@Entity('accounts')
export class AccountEntity extends IEntity {
  @Column({ unique: true })
  public key: string;

  @Column({ type: 'uuid', name: 'user_id' })
  public userId: string;

  @Column({ name: 'verifier' })
  public verifier: string;

  @Column({ name: 'salt' })
  public salt: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  public user?: UserEntity;
}

export default AccountEntity;
