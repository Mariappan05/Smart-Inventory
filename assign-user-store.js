// Assign store to current logged-in user
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Available Stores ===');
  const stores = await prisma.store.findMany({
    select: { id: true, name: true, code: true }
  });
  
  if (stores.length === 0) {
    console.log('No stores found. Creating default store...');
    const defaultStore = await prisma.store.create({
      data: {
        name: 'Main Store',
        code: 'STORE001'
      }
    });
    stores.push(defaultStore);
    console.log(`Created: ${defaultStore.code} - ${defaultStore.name}`);
  } else {
    stores.forEach(s => console.log(`${s.code} - ${s.name} (ID: ${s.id})`));
  }

  console.log('\n=== Users Without Store ===');
  const usersWithoutStore = await prisma.user.findMany({
    where: { storeId: null },
    select: { id: true, name: true, email: true, role: true }
  });
  
  if (usersWithoutStore.length === 0) {
    console.log('All users have stores assigned!');
    return;
  }
  
  usersWithoutStore.forEach(u => console.log(`${u.name} (${u.email}) - ${u.role}`));

  // Assign first store to all users without store
  const firstStore = stores[0];
  console.log(`\n=== Assigning ${firstStore.code} to all users without store ===`);
  
  for (const user of usersWithoutStore) {
    await prisma.user.update({
      where: { id: user.id },
      data: { storeId: firstStore.id }
    });
    console.log(`✓ Assigned to ${user.name} (${user.email})`);
  }
  
  console.log('\n✓ All users now have stores assigned!');
  console.log('\nNext steps:');
  console.log('1. Log out from the application');
  console.log('2. Log back in to get a new token with storeId');
  console.log('3. All pages will now show data filtered by your store');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
