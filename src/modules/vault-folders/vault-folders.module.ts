import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import VaultFolderEntity from '~/db/entities/vault-folder.entity';
import AccountsModule from '../accounts/accounts.module';
import VaultsModule from '../vaults/vaults.module';
import VaultFoldersController from './vault-folders.controller';
import VaultFoldersService from './vault-folders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VaultFolderEntity]),
    AccountsModule,
    forwardRef(() => VaultsModule),
  ],
  controllers: [VaultFoldersController],
  providers: [VaultFoldersService],
  exports: [VaultFoldersService],
})
export class VaultFoldersModule {}

export default VaultFoldersModule;
