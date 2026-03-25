// Database singleton - Padaria Paula
// Configurado para PostgreSQL (Supabase) com pooler

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuração otimizada para Vercel Serverless
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

// Em desenvolvimento, salva no global para evitar múltiplas conexões
// Em produção (Vercel), cada função cria sua própria conexão
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Graceful shutdown (importante para Vercel)
if (process.env.NODE_ENV === 'production') {
  // Desconectar quando a função terminar
  process.on('beforeExit', async () => {
    await db.$disconnect().catch(() => {})
  })
}
