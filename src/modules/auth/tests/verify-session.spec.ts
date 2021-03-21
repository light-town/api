import { AuthService } from '../auth.service';
import { createTestingModule } from './helpers/createTestingModule';
import * as faker from 'faker';
import * as dotenv from 'dotenv';
import { TestingModule } from '@nestjs/testing';
import SessionsService from '~/modules/sessions/sessions.service';
import { VerifySessionStageEnum } from '~/modules/sessions/sessions.dto';
import { VerifySessionPayload } from '../auth.dto';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

dotenv.config();

describe('[Unit] [Auth Module] ...', () => {
  let moduleFixture: TestingModule;
  let sessionsService: SessionsService;
  let authService: AuthService;

  beforeAll(async () => {
    moduleFixture = await createTestingModule();

    sessionsService = moduleFixture.get<SessionsService>(SessionsService);
    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should verify session', async () => {
    const TEST_SESSION = {
      id: faker.random.uuid(),
      verifyStage: {
        name: VerifySessionStageEnum.REQUIRED,
      },
    };

    const TEST_SESSION_VERIFY_STAGE = {
      id: faker.random.uuid(),
    };

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const findOneVerifyStageFunc = jest
      .spyOn(sessionsService, 'findOneVerifyStage')
      .mockResolvedValueOnce(<any>TEST_SESSION_VERIFY_STAGE);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    const payload: VerifySessionPayload = {
      sessionUuid: TEST_SESSION.id,
    };
    const response = await authService.verifySession(payload);

    expect(response.stage).toEqual(VerifySessionStageEnum.IN_PROGRESS);

    expect(findOneSessionFunc).toBeCalledTimes(1);
    expect(findOneSessionFunc).toBeCalledWith({
      select: ['id', 'verifyStage'],
      where: {
        id: TEST_SESSION.id,
        expiresAt: (findOneSessionFunc.mock.calls[0][0].where as any).expiresAt,
        isDeleted: false,
      },
    });

    expect(findOneVerifyStageFunc).toBeCalledTimes(1);
    expect(findOneVerifyStageFunc).toBeCalledWith({
      select: ['id'],
      where: {
        name: VerifySessionStageEnum.IN_PROGRESS,
        isDeleted: false,
      },
    });

    expect(updateSessionFunc).toBeCalledTimes(1);
    expect(updateSessionFunc).toBeCalledWith(
      { id: TEST_SESSION.id },
      { verifyStageId: TEST_SESSION_VERIFY_STAGE.id }
    );
  });

  it('should throw error when session was not found', async () => {
    const TEST_SESSION = {
      id: faker.random.uuid(),
      verifyStage: {
        name: VerifySessionStageEnum.REQUIRED,
      },
    };

    const TEST_SESSION_VERIFY_STAGE = {
      id: faker.random.uuid(),
    };

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(undefined);

    const findOneVerifyStageFunc = jest
      .spyOn(sessionsService, 'findOneVerifyStage')
      .mockResolvedValueOnce(<any>TEST_SESSION_VERIFY_STAGE);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    const payload: VerifySessionPayload = {
      sessionUuid: TEST_SESSION.id,
    };

    try {
      await authService.verifySession(payload);
    } catch (e) {
      expect(e).toStrictEqual(
        new NotFoundException('The session was not found')
      );
    }

    expect(findOneSessionFunc).toBeCalledTimes(1);
    expect(findOneSessionFunc).toBeCalledWith({
      select: ['id', 'verifyStage'],
      where: {
        id: TEST_SESSION.id,
        expiresAt: (findOneSessionFunc.mock.calls[0][0].where as any).expiresAt,
        isDeleted: false,
      },
    });

    expect(findOneVerifyStageFunc).toBeCalledTimes(0);
    expect(updateSessionFunc).toBeCalledTimes(0);
  });

  it(`should return current verify stage when session verify stage is not ${VerifySessionStageEnum.REQUIRED}`, async () => {
    const TEST_SESSION = {
      id: faker.random.uuid(),
      verifyStage: {
        name: VerifySessionStageEnum.NOT_REQUIRED,
      },
    };

    const TEST_SESSION_VERIFY_STAGE = {
      id: faker.random.uuid(),
    };

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const findOneVerifyStageFunc = jest
      .spyOn(sessionsService, 'findOneVerifyStage')
      .mockResolvedValueOnce(<any>TEST_SESSION_VERIFY_STAGE);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    const payload: VerifySessionPayload = {
      sessionUuid: TEST_SESSION.id,
    };

    expect(await authService.verifySession(payload)).toStrictEqual({
      stage: TEST_SESSION.verifyStage.name,
    });

    expect(findOneSessionFunc).toBeCalledTimes(1);
    expect(findOneSessionFunc).toBeCalledWith({
      select: ['id', 'verifyStage'],
      where: {
        id: TEST_SESSION.id,
        expiresAt: (findOneSessionFunc.mock.calls[0][0].where as any).expiresAt,
        isDeleted: false,
      },
    });

    expect(findOneVerifyStageFunc).toBeCalledTimes(0);
    expect(updateSessionFunc).toBeCalledTimes(0);
  });

  it(`should throw error when ${VerifySessionStageEnum.IN_PROGRESS} session verify stage was not found`, async () => {
    const TEST_SESSION = {
      id: faker.random.uuid(),
      verifyStage: {
        name: VerifySessionStageEnum.REQUIRED,
      },
    };

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const findOneVerifyStageFunc = jest
      .spyOn(sessionsService, 'findOneVerifyStage')
      .mockResolvedValueOnce(undefined);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    const payload: VerifySessionPayload = {
      sessionUuid: TEST_SESSION.id,
    };

    try {
      await authService.verifySession(payload);
    } catch (e) {
      expect(e).toStrictEqual(
        new InternalServerErrorException(
          `The '${VerifySessionStageEnum.IN_PROGRESS}' session verify stage was not found`
        )
      );
    }

    expect(findOneSessionFunc).toBeCalledTimes(1);
    expect(findOneSessionFunc).toBeCalledWith({
      select: ['id', 'verifyStage'],
      where: {
        id: TEST_SESSION.id,
        expiresAt: (findOneSessionFunc.mock.calls[0][0].where as any).expiresAt,
        isDeleted: false,
      },
    });

    expect(findOneVerifyStageFunc).toBeCalledTimes(1);
    expect(findOneVerifyStageFunc).toBeCalledWith({
      select: ['id'],
      where: {
        name: VerifySessionStageEnum.IN_PROGRESS,
        isDeleted: false,
      },
    });

    expect(updateSessionFunc).toBeCalledTimes(0);
  });
});
