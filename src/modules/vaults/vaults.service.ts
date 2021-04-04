import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import VaultEntity from '~/db/entities/vault.entity';
import { PrimaryVault } from './vaults.dto';

@Injectable()
export class VaultsService {
  public constructor(
    @InjectRepository(VaultEntity)
    private readonly vaultsRepository: Repository<VaultEntity>
  ) {}

  public create(primaryVault: PrimaryVault): Promise<VaultEntity> {
    return this.vaultsRepository.save(
      this.vaultsRepository.create({
        encKey: primaryVault.encVaultKey,
      })
    );
  }

  public async exists(vaultId: string): Promise<boolean> {
    const vault = await this.vaultsRepository.findOne({
      select: ['id'],
      where: { id: vaultId, isDeleted: false },
    });

    return vault !== undefined;
  }
}

export default VaultsService;
