import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { IEntity } from './entity.interface';
import DeviceEntity from './device.entity';
import AccountEntity from './account.entity';
import SessionVerificationStageEntity from './session-verification-stage.entity';
import VerificationDeviceEntity from './verification-devices.entity';

@Entity('sessions')
export class SessionEntity extends IEntity {
  @Column()
  public secret: string; // serverSecretEphemeral

  @Column({ type: 'timestamp', nullable: true })
  public expiresAt: Date;

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

  @Column({ type: 'uuid', name: 'verification_stage_id' })
  public verificationStageId: string;

  @ManyToOne(() => SessionVerificationStageEntity)
  @JoinColumn({
    name: 'verification_stage_id',
    referencedColumnName: 'id',
  })
  public verificationStage?: SessionVerificationStageEntity;

  @Column({ type: 'uuid', name: 'verification_device_id', nullable: true })
  public verificationDeviceId?: string;

  @ManyToOne(() => VerificationDeviceEntity)
  @JoinColumn({
    name: 'verification_device_id',
    referencedColumnName: 'id',
  })
  public verificationDevice?: VerificationDeviceEntity;
}

export default SessionEntity;
