// Search for Industrial Command user
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'Industrial' } },
        { name: { contains: 'Command' } }
      ]
    },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true,
      storeId: true,
      store: { select: { name: true, code: true } }
    }
  });
  
  console.log('\n=== Search Results ===');
  if (users.length === 0) {
    console.log('No users found with "Industrial" or "Command" in name');
  } else {
    users.forEach(u => {
      const store = u.store ? `${u.store.code} - ${u.store.name}` : 'NO STORE';
      console.log(`\nName: ${u.name}`);
      console.log(`Email: ${u.email}`);
      console.log(`Role: ${u.role}`);
      console.log(`Store: ${store}`);
      console.log(`StoreId: ${u.storeId}`);
      console.log(`UserId: ${u.id}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
