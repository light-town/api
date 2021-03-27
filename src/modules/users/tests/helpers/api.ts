import AbstractApi from '~/../test/abstract-api';

export class Api extends AbstractApi {
  getMe(token: string) {
    return this.handle.get('/me').set({
      Authorization: `Bearer ${token}`,
    });
  }
}

export default Api;
