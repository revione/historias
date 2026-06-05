import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

declare global {
  var __prisma: PrismaClient | undefined
}

function createClient() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  console.log('[db] create client url=', url, 'token?', authToken ? 'yes' : 'NO')
  if (!url) throw new Error('TURSO_DATABASE_URL not set')
  const adapter = new PrismaLibSql({ url, authToken })
  const client = new PrismaClient({ adapter })
  client.$queryRaw`SELECT 1`
    .then(() => console.log('[db] connection OK'))
    .catch((e) => console.error('[db] connection FAIL', e))
  return client
}

export const prisma = global.__prisma ?? createClient()
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma
