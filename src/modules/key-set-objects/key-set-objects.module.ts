import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import KeySetObjectEntity from '~/db/entities/key-set-object.entity';
import KeySetsModule from '../key-sets/key-sets.module';
import TeamsModule from '../teams/teams.module';
import VaultsModule from '../vaults/vaults.module';
import KeySetObjectsService from './key-set-objects.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([KeySetObjectEntity]),
    forwardRef(() => KeySetsModule),
    forwardRef(() => VaultsModule),
    forwardRef(() => TeamsModule),
  ],
  providers: [KeySetObjectsService],
  exports: [KeySetObjectsService],
})
export class KeySetObjectsModule {}

export default KeySetObjectsModule;
