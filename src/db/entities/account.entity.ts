import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { IEntity } from './entity.interface';
import UserEntity from './user.entity';

@Entity()
export class AccountEntity extends IEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  public userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  public user?: UserEntity;
}

export default AccountEntity;
