import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { IEntity } from './entity.interface';
import DeviceEntity from './device.entity';
import AccountEntity from './account.entity';

@Entity('verification_devices')
export class VerificationDeviceEntity extends IEntity {
  @Column({ type: 'uuid', name: 'account_id' })
  public accountId: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({
    name: 'account_id',
    referencedColumnName: 'id',
  })
  public account?: AccountEntity;

  @Column({ type: 'uuid', name: 'device_id' })
  public deviceId: string;

  @ManyToOne(() => DeviceEntity)
  @JoinColumn({
    name: 'device_id',
    referencedColumnName: 'id',
  })
  public device?: DeviceEntity;
}

export default VerificationDeviceEntity;
