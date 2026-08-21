// ============================================================================
// CLIENTE PRISMA — ponto único de conexão com o banco de dados.
// Sempre importe o Prisma a partir daqui (nunca faça `new PrismaClient()`
// direto em uma rota), para não abrir uma conexão nova a cada requisição
// em desenvolvimento (hot-reload do Next.js).
// ============================================================================
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
