const { PrismaClient } = require('@prisma/client');

async function getStoreId() {
  const prisma = new PrismaClient();
  const store = await prisma.store.findFirst({
    select: { id: true, name: true }
  });
  console.log(JSON.stringify(store));
  await prisma.$disconnect();
}

getStoreId();
