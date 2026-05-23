import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@your-company.local";
  const adminPassword = "Admin@123";

  const adminHashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create store first
  const store = await prisma.store.upsert({
    where: { name: "Chennai" },
    update: {},
    create: {
      name: "Chennai",
      code: "STORE001",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      hashedPassword: adminHashedPassword,
      role: "ADMIN",
      name: "Admin",
      storeId: store.id,
    },
    create: {
      employeeNo: "ADM001",
      email: adminEmail,
      name: "Admin",
      role: "ADMIN",
      hashedPassword: adminHashedPassword,
      storeId: store.id,
    },
  });

  console.log({ admin, store });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
