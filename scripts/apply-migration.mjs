// apply-migration.mjs
// Aplica un archivo .sql contra la base Turso usando @libsql/client.
// Reemplaza `prisma migrate deploy` porque Prisma no soporta URLs libsql://.
// Uso: node scripts/apply-migration.mjs <ruta-al-sql>
// Parsea statements por `;` final de línea, ignora líneas que empiezan con `--`,
// ejecuta uno por uno y aborta al primer error.

import 'dotenv/config'
import { createClient } from '@libsql/client'
import fs from 'fs'
import path from 'path'

const sqlPath = process.argv[2]
if (!sqlPath) { console.error('usage: node scripts/apply-migration.mjs <path-to.sql>'); process.exit(1) }

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
if (!url || !authToken) { console.error('TURSO_DATABASE_URL / TURSO_AUTH_TOKEN missing'); process.exit(1) }

const client = createClient({ url, authToken })
const raw = fs.readFileSync(path.resolve(sqlPath), 'utf8')
const stripped = raw.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
const statements = stripped.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)

for (const stmt of statements) {
  try {
    await client.execute(stmt)
    console.log('OK:', stmt.split('\n')[0].slice(0, 80))
  } catch (err) {
    console.error('FAIL:', stmt.split('\n')[0].slice(0, 80), '->', err.message)
    process.exit(1)
  }
}
console.log('Done.')
