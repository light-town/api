import AbstractApi from '~/../test/abstract-api';

export default class Api extends AbstractApi {
  getAccount(accountKey: string) {
    return this.handle.get(`/accounts?key=${accountKey}`);
  }
}
