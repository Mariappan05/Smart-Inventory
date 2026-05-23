import { prisma } from "@/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      employeeNo: true,
      name: true,
      isActive: true,
      role: true,
    },
  });

  console.log("Users in database:");
  console.log(JSON.stringify(users, null, 2));

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
