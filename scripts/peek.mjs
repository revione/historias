// peek.mjs
// Imprime las primeras 5 filas de cada tabla de analytics en Turso.
// Sirve para debug rápido: ver si recordView / recordHit están escribiendo,
// qué sesiones hay activas, qué datos crudos llegaron.
// Uso: node scripts/peek.mjs

import 'dotenv/config'
import { createClient } from '@libsql/client'

async function main() {
  const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  for (const t of ['SiteStats', 'PostStats', 'SessionView', 'ViewEvent', 'ActiveReader']) {
    const r = await c.execute(`SELECT * FROM ${t} LIMIT 5`)
    console.log(`\n[${t}] (${r.rows.length} rows)`)
    for (const row of r.rows) console.log(' ', row)
  }
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
