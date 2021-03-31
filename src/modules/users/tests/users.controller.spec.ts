import { INestApplication } from '@nestjs/common';
import createTestingModule from './helpers/createTestingModule';
import * as faker from 'faker';
import Api from './helpers/api';
import { JwtService } from '@nestjs/jwt';
import UsersService from '../users.service';

describe('[Users Module] [Controller] ...', () => {
  let api: Api;
  let app: INestApplication;
  let jwtService: JwtService;
  let usersService: UsersService;

  beforeAll(async () => {
    app = await createTestingModule();

    api = new Api(app);

    jwtService = app.get<JwtService>(JwtService);
    usersService = app.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get me infornation', async () => {
    const TEST_USER = {
      id: faker.datatype.uuid(),
      name: faker.internet.userName(),
    };
    const TEST_TOKEN = jwtService.sign({ id: TEST_USER.id });

    const findOneUserFn = jest
      .spyOn(usersService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_USER);

    const response = await api.getMe(TEST_TOKEN);

    expect(response.status).toEqual(200);
    expect(response.body).toStrictEqual({
      data: TEST_USER,
      statusCode: 200,
    });

    expect(findOneUserFn).toBeCalledTimes(1);
    expect(findOneUserFn).toBeCalledWith({
      select: ['id', 'name', 'avatarUrl'],
      where: { id: TEST_USER.id },
    });
  });

  it('should throw error whene token is not provided', async () => {
    const findOneUserFn = jest.spyOn(usersService, 'findOne');

    const response = await api.getMe(undefined);

    expect(response.status).toEqual(401);
    expect(response.body).toStrictEqual({
      error: {
        type: 'Unauthorized',
        message: 'The authentication fails',
      },
      statusCode: 401,
    });

    expect(findOneUserFn).toBeCalledTimes(0);
  });
});
