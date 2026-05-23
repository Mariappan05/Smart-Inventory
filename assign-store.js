// Quick script to assign store to user
// Run with: node assign-store.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // List all stores
  console.log('\n=== Available Stores ===');
  const stores = await prisma.store.findMany({
    select: { id: true, name: true, code: true }
  });
  stores.forEach(s => console.log(`${s.code} - ${s.name} (ID: ${s.id})`));

  // List users without store
  console.log('\n=== Users Without Store ===');
  const usersWithoutStore = await prisma.user.findMany({
    where: { storeId: null },
    select: { id: true, name: true, email: true, role: true }
  });
  usersWithoutStore.forEach(u => console.log(`${u.name} (${u.email}) - ${u.role} - ID: ${u.id}`));

  // If you want to assign a store, uncomment and modify these lines:
  // const userId = 'USER_ID_HERE';
  // const storeId = 'STORE_ID_HERE';
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: { storeId }
  // });
  // console.log(`\nAssigned store ${storeId} to user ${userId}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
