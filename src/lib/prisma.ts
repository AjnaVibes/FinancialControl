// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Usa una variable global para evitar múltiples instancias en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Crea una instancia si no existe
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

// Solo guarda la instancia global en desarrollo
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
