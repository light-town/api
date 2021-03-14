import { Column, Entity } from 'typeorm';
import { IEntity } from './entity.interface';

@Entity('users')
export class UserEntity extends IEntity {
  @Column({ length: 256 })
  public name: string;

  @Column({ length: 2048, nullable: true, name: 'avatar_url' })
  public avatarURL: string;
}

export default UserEntity;
