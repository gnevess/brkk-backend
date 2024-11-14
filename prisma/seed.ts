const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seed() {
  // add path for seed files
  const seedFilesPath = path.join(__dirname, 'seeders');

  const seedFiles = fs.readdirSync(seedFilesPath).filter((file: string) => file.endsWith('.seed.ts'));
  console.log(seedFiles);

  for (const seedFile of seedFiles) {
    const seedFilePath = path.join(seedFilesPath, seedFile);
    const { default: seedFunction } = require(seedFilePath);
    await seedFunction(prisma);
  }

  console.log('Seeding completed successfully');
}

seed()
  .catch(error => {
    console.error('Seeding error:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
