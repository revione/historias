// list-tables.mjs
// Imprime los nombres de todas las tablas en la base Turso.
// Útil para verificar tras una migración o cuando algo no aparece donde debería.
// Uso: node scripts/list-tables.mjs

import 'dotenv/config'
import { createClient } from '@libsql/client'

async function main() {
  const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  const r = await c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  console.log('tables:', r.rows.map((x) => x.name).join(', '))
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
