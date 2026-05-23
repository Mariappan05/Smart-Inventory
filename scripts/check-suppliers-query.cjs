const { PrismaClient } = require("@prisma/client");

(async () => {
  const prisma = new PrismaClient();
  try {
    const suppliers = await prisma.supplier.findMany({
      take: 5,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    });

    console.log("OK supplier query. Sample rows:");
    console.log(suppliers);
  } finally {
    await prisma.$disconnect();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
