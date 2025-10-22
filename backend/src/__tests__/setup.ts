import { prisma } from "../lib/db";

beforeAll(async () => {
  // Create test users
  await prisma.user.createMany({
    data: [
      {
        address: "0x123",
        username: "testuser1",
      },
      {
        address: "0x456",
        username: "testuser2",
      },
    ],
    skipDuplicates: true,
  });

  // Create a test will
  await prisma.will.create({
    data: {
      creatorAddress: "0x123",
      willName: "Test Will 1",
      willDescription: "This is a test will.",
      beneficiaryAddress: "0x456",
      timeLock: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day in the past
      encryptedShare: {
        create: { share1: "test-share-1", share2: "test-share-1" },
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
