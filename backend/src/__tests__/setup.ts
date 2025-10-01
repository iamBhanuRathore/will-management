
import { prisma } from '../lib/db';

beforeAll(async () => {
  // Create test users
  await prisma.user.createMany({
    data: [
      {
        id: 'test-user-1',
        address: '0x123',
        username: 'testuser1',
      },
      {
        id: 'test-user-2',
        address: '0x456',
        username: 'testuser2',
      },
    ],
    skipDuplicates: true,
  });

  // Create a test will
  await prisma.will.create({
    data: {
      id: 'test-will-1',
      willName: 'Test Will 1',
      willDescription: 'This is a test will.',
      creatorId: 'test-user-1',
      beneficiaryName: 'Test User 2',
      beneficiaryAddress: '0x456',
      beneficiaryId: 'test-user-2',
      timeLock: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day in the past
      encryptedShare: {
        create: { share: 'test-share' },
      },
    },
  });
});

afterAll(async () => {
  // Clean up the database
  await prisma.will.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});
