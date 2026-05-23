// List all users
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== All Users ===');
  const users = await prisma.user.findMany({
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true,
      storeId: true,
      store: { select: { name: true } }
    }
  });
  users.forEach(u => {
    const store = u.store ? u.store.name : 'NO STORE';
    console.log(`${u.name} (${u.email}) - ${u.role} - Store: ${store}`);
    console.log(`  ID: ${u.id}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
