import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import KeySetEntity from '~/db/entities/key-sets.entity';
import AccountsModule from '../accounts/accounts.module';
import VaultsModule from '../vaults/vaults.module';
import KeySetsService from './key-sets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([KeySetEntity]),
    AccountsModule,
    VaultsModule,
  ],
  providers: [KeySetsService],
  exports: [KeySetsService],
})
export class KeySetsModule {}

export default KeySetsModule;
