import { PrismaClient } from "@prisma/client";

/**
 * Single PrismaClient per server process. Required on Vercel/serverless so warm
 * invocations reuse one client instead of opening new pools toward Supabase.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

globalForPrisma.prisma = prisma;

