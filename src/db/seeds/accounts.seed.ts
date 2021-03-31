import * as faker from 'faker';
import AccountEntity from '~/db/entities/account.entity';
import Factory from './factory';
import Seeder from './seeder';
import core from '@light-town/core';

export class AccountsFactory implements Factory<AccountEntity> {
  public create({
    userId,
    mfaTypeId,
    password,
  }: Partial<AccountEntity> & any = {}) {
    const accountKey = core.common.generateAccountKey({
      versionCode: 'A1',
      secret: faker.random.word(),
    });

    const verifier = core.srp.client.deriveVerifier(accountKey, password);

    const account = new AccountEntity();
    account.userId = userId;
    account.mfaTypeId = mfaTypeId;
    account.salt = verifier.salt;
    account.key = accountKey;
    account.verifier = verifier.verifier;
    return account;
  }
}

export class AccountsSeeder extends Seeder<AccountEntity>(AccountEntity) {
  public constructor(factory: AccountsFactory) {
    super(factory);
  }
}

export default AccountsSeeder;
