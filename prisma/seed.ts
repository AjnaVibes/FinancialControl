import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin", displayName: "Administrador" }
  });
  const viewerRole = await prisma.role.upsert({
    where: { name: "viewer" },
    update: {},
    create: { name: "viewer", displayName: "Lector" }
  });

  console.log("Roles creados:", { adminRole, viewerRole });
}

main().finally(async () => prisma.$disconnect());
