export const mockRepository = jest.fn(() => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(() => {
    const builder = {
      select: jest.fn(() => builder),
      addSelect: jest.fn(() => builder),
      innerJoin: jest.fn(() => builder),
      innerJoinAndSelect: jest.fn(() => builder),
      where: jest.fn(() => builder),
      andWhere: jest.fn(() => builder),
      orderBy: jest.fn(() => builder),
      getRawOne: jest.fn(() => builder),
      getRawMany: jest.fn(() => builder),
      getOne: jest.fn(() => builder),
      getMany: jest.fn(() => builder),
    };
    return builder;
  }),
  manager: {
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
}));

export default mockRepository;
