import { Column, Entity } from 'typeorm';
import { IEntity } from './entity.interface';

@Entity('devices')
export class DeviceEntity extends IEntity {
  @Column()
  public os: string;

  @Column({ name: 'user-agent', nullable: true })
  public userAgent: string;

  @Column({ name: 'hostname' })
  public hostname: string;

  @Column({ name: 'model', nullable: true })
  public model?: string;
}

export default DeviceEntity;
