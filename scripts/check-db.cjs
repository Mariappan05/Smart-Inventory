const { PrismaClient } = require("@prisma/client");

(async () => {
  const prisma = new PrismaClient();
  try {
    const [userCount, productCount] = await prisma.$transaction([
      prisma.user.count(),
      prisma.product.count(),
    ]);

    console.log({ userCount, productCount });
  } finally {
    await prisma.$disconnect();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
