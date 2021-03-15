import { Column, Entity } from 'typeorm';
import { IEntity } from './entity.interface';

@Entity('devices')
export class DeviceEntity extends IEntity {
  @Column()
  public op: string;

  @Column({ name: 'user-agent', nullable: true })
  public userAgent: string;

  @Column({ name: 'hostname' })
  public hostname: string;
}

export default DeviceEntity;
