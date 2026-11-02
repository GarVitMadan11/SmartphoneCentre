const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fourGModelNames = [
  // Motorola 4G
  'Motorola Moto E13', 'Motorola Moto E14', 'Motorola Moto E15', 'Motorola Moto E22', 'Motorola Moto E22i', 'Motorola Moto E22s', 'Motorola Moto E32', 'Motorola Moto E32s',
  'Motorola G04', 'Motorola Moto G04s', 'Motorola Moto G05', 'Motorola Moto G13', 'Motorola Moto G14', 'Motorola Moto G22', 'Motorola Moto G23', 'Motorola Moto G24', 'Motorola Moto G24 Power', 'Motorola Moto G32', 'Motorola Moto G42', 'Motorola Moto G72',

  // OPPO 4G
  'OPPO A17', 'OPPO A17k', 'OPPO A18', 'OPPO A36', 'OPPO A38', 'OPPO A5', 'OPPO A57', 'OPPO A58 4G', 'OPPO A5x', 'OPPO A76', 'OPPO A77', 'OPPO A77s', 'OPPO A78', 'OPPO A96', 'OPPO A6', 'OPPO A6c', 'OPPO A6k', 'OPPO A6x', 'OPPO A6t Pro 4G',
  'OPPO F21', 'OPPO F23',

  // Samsung 4G
  'Galaxy A03', 'Galaxy A04', 'Galaxy A04e', 'Galaxy A04s', 'Galaxy A05', 'Galaxy A05s', 'Galaxy A24',
  'Galaxy F04', 'Galaxy F05', 'Galaxy F07', 'Galaxy F13', 'Galaxy F47',
  'Galaxy M04', 'Galaxy M05', 'Galaxy M07', 'Galaxy M47',

  // vivo 4G
  'vivo T1 44W',
  'vivo Y05', 'vivo Y16', 'vivo Y17s', 'vivo Y18', 'vivo Y18e', 'vivo Y21G', 'vivo Y22', 'vivo Y35', 'vivo Y36',

  // Xiaomi / Redmi 4G
  'Redmi A2+', 'Redmi A3', 'Redmi A3X',
  'Redmi 10 Power', 'Redmi 10 Prime 2022', 'Redmi 12C', 'Redmi 14',
  'Redmi Note 11', 'Redmi Note 11s'
];

async function run() {
  console.log('--- Step 1: Pre-flight Verification ---');
  const activeCountBefore = await prisma.model.count({ where: { hidden: false } });
  console.log(`Active models before: ${activeCountBefore}`);
  if (activeCountBefore !== 193) {
    throw new Error(`CRITICAL GUARD: Expected 193 active models, found ${activeCountBefore}! Aborting.`);
  }

  const hiddenCountBefore = await prisma.model.count({ where: { hidden: true } });
  console.log(`Hidden models before: ${hiddenCountBefore}`);

  console.log('\n--- Step 2: Deleting 4G hidden models only ---');
  const deleteResult = await prisma.model.deleteMany({
    where: {
      hidden: true,
      name: { in: fourGModelNames }
    }
  });
  console.log(`Successfully deleted ${deleteResult.count} 4G models from hidden catalog.`);

  console.log('\n--- Step 3: Post-flight Active Guard Check ---');
  const activeCountAfter = await prisma.model.count({ where: { hidden: false } });
  const hiddenCountAfter = await prisma.model.count({ where: { hidden: true } });
  console.log({ activeCountAfter, hiddenCountAfter });

  if (activeCountAfter !== 193) {
    throw new Error(`CRITICAL ERROR: Active models count altered to ${activeCountAfter}!`);
  }
  console.log('SUCCESS: Active models count is strictly 193 (100% untouched).');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

