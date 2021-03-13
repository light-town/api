export const mockUsersService = jest.fn(() => ({
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
}));
