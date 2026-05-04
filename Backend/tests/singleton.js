import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

export const prismaMock = mockDeep();

beforeEach(() => {
  mockReset(prismaMock);
});