const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Checking Store and User Data ===\n');
  
  // Check all stores
  const stores = await prisma.store.findMany({
    select: { id: true, name: true, code: true }
  });
  
  console.log(`Total stores: ${stores.length}`);
  stores.forEach(s => console.log(`  - ${s.code}: ${s.name} (ID: ${s.id})`));
  
  // Check users and their storeIds
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, storeId: true }
  });
  
  console.log(`\nTotal users: ${users.length}`);
  users.forEach(u => console.log(`  - ${u.name} (${u.email}): storeId = ${u.storeId}`));
  
  // Find users with invalid storeId
  const usersWithInvalidStore = [];
  for (const user of users) {
    if (user.storeId) {
      const storeExists = stores.find(s => s.id === user.storeId);
      if (!storeExists) {
        usersWithInvalidStore.push(user);
      }
    }
  }
  
  if (usersWithInvalidStore.length > 0) {
    console.log('\n=== Users with Invalid Store IDs ===');
    usersWithInvalidStore.forEach(u => {
      console.log(`  - ${u.name}: ${u.storeId} (DOES NOT EXIST)`);
    });
    
    if (stores.length > 0) {
      console.log(`\n=== Fixing Invalid Store References ===`);
      const firstStore = stores[0];
      
      for (const user of usersWithInvalidStore) {
        await prisma.user.update({
          where: { id: user.id },
          data: { storeId: firstStore.id }
        });
        console.log(`  ✓ Updated ${user.name} to use ${firstStore.code}`);
      }
    }
  } else {
    console.log('\n✓ All users have valid store references');
  }
  
  console.log('\n=== Done ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
