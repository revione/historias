# Plan: Analytics propias + Vercel Analytics

Estado: borrador. No implementado todavía.

## Objetivo

Dos capas complementarias:

1. **Vercel Analytics** — panel privado: tiempo en página, scroll depth, eventos de audio, dispositivos, paths, referrers.
2. **Contador propio (Prisma)** — datos públicos en UI:
   - Total visitas sitio (footer).
   - Visitas únicas por historia (bajo título).
   - Top 3 historias (footer o home).
   - "Leyendo ahora" en vivo por historia.
   - Histórico agregable (semana / mes / año) para versión futura.

Sin login por ahora. Futuro: auth + comentarios + propuestas de cambios.

---

## Stack

- **DB**: Turso (libSQL, SQLite-compatible, edge, free tier). Razón: el usuario prefiere SQLite; Vercel mata SQLite local. Turso resuelve sin cambiar mental model.
  - Alternativa si rechaza Turso: Neon Postgres.
- **ORM**: Prisma con `@libsql/client` driver adapter.
- **Server actions**: toda escritura/lectura va por actions en `src/app/actions.ts` o `src/lib/analytics/actions.ts`.
- **Realtime "leyendo ahora"**: presencia vía heartbeat en tabla `ActiveReader` con TTL lógico (ver más abajo). Sin WebSockets en v1 — polling cliente cada 15s.
- **Vercel Analytics**: paquete `@vercel/analytics`, `<Analytics />` en root layout. Custom events para scroll-end y audio-listen.

---

## Modelo Prisma

```prisma
// Contadores agregados por slug — lectura barata para UI
model PostStats {
  slug         String   @id
  section      String
  views        Int      @default(0)   // total accesos (no únicos)
  uniqueViews  Int      @default(0)   // sesiones únicas
  lastViewedAt DateTime @updatedAt
  @@index([section])
  @@index([views])
}

// Contador global sitio (1 sola fila id="site")
model SiteStats {
  id          String @id @default("site")
  totalViews  Int    @default(0)
  uniqueViews Int    @default(0)
  updatedAt   DateTime @updatedAt
}

// Registro de qué sesión vio qué slug — anti-duplicado por sesión
// Una fila por (sessionId, slug). UPSERT al entrar a historia.
model SessionView {
  sessionId String
  slug      String
  firstAt   DateTime @default(now())
  lastAt    DateTime @updatedAt
  views     Int      @default(1)
  @@id([sessionId, slug])
  @@index([slug])
  @@index([sessionId])
}

// Eventos crudos para histórico (semana/mes/año futuro)
// Se inserta SIEMPRE, pero con sessionId hasheado (privacidad).
// Job futuro agrega esto a buckets semanales y borra crudo > N días.
model ViewEvent {
  id         BigInt   @id @default(autoincrement())
  slug       String
  sessionHash String  // hash(sessionId) — no PII directa
  ts         DateTime @default(now())
  source     String?  // referrer host
  country    String?  // Vercel header `x-vercel-ip-country`
  @@index([slug, ts])
  @@index([ts])
}

// Buckets pre-agregados para gráficas históricas (job nocturno)
model ViewBucket {
  id      String   @id  // "post:slug:2026-W23" / "site:2026-06"
  scope   String   // "post" | "site"
  slug    String?  // null si scope=site
  period  String   // "day" | "week" | "month" | "year"
  bucket  String   // "2026-06-04" | "2026-W23" | "2026-06" | "2026"
  views   Int
  uniques Int
  @@index([scope, slug, period])
}

// Presencia: lectores activos por slug. Heartbeat cliente cada 15s.
// Lectura cuenta filas WHERE lastPing > now()-30s.
// Job/cron limpia filas viejas; lectura igual filtra por ventana.
model ActiveReader {
  sessionId String
  slug      String
  lastPing  DateTime @default(now())
  @@id([sessionId, slug])
  @@index([slug, lastPing])
}
```

---

## Identidad de sesión

Cookie `sid` (httpOnly, sameSite=lax, ~365 días, sin IP, sin PII).

- Generada en middleware si no existe: `crypto.randomUUID()`.
- Para `ViewEvent.sessionHash` se usa `sha256(sid + SALT)` (no reversible, agrupa pero no identifica).
- IP NO se guarda. País sí (Vercel ya lo da en header, no es PII).
- "Visita única por historia" = una fila `SessionView` por par `(sid, slug)`. Si misma sesión vuelve, NO incrementa `uniqueViews`, sí incrementa `views` (configurable).

Bot filtering: descartar `user-agent` que matchee regex de crawlers conocidos (lista en `src/lib/analytics/bots.ts`).

---

## Server actions

`src/lib/analytics/actions.ts`:

```ts
'use server'

// Registra acceso. Llamada desde StoryPageClient al montar.
// Idempotente por (sid, slug) en cuanto a uniqueViews.
export async function recordView(slug: string, section: string): Promise<void>

// Heartbeat de presencia. Llamada cada 15s mientras la historia está visible.
export async function pingActive(slug: string): Promise<void>

// Lecturas para UI (cacheadas con unstable_cache, revalidate 30s)
export async function getPostStats(slug: string): Promise<{ views: number; unique: number }>
export async function getSiteStats(): Promise<{ total: number; unique: number }>
export async function getTopPosts(limit?: number): Promise<Array<{ slug; views; section; title? }>>
export async function getActiveReaders(slug: string): Promise<number>
```

Flujo `recordView`:

1. Lee cookie `sid`. Si falta, falla silenciosa (middleware debería haberla creado).
2. Si bot UA → return.
3. Transacción:
   - UPSERT `SessionView` (sid, slug). Si fue INSERT → `isUnique = true`.
   - INCR `PostStats.views`. Si `isUnique` → INCR `uniqueViews` también.
   - INCR `SiteStats.totalViews`. Si `isUnique` para sesión nueva del sitio (primer slug que ve) → INCR `uniqueViews`.
   - INSERT `ViewEvent` con `sessionHash`, country, referrer.
4. No bloquea render (fire-and-forget desde client `useEffect`).

Flujo `pingActive`:

- UPSERT `ActiveReader (sid, slug)` con `lastPing = now()`.

Flujo `getActiveReaders`:

- `COUNT(*) WHERE slug = ? AND lastPing > now() - 30s`.

Rate limit: token bucket en memoria (Map) por `sid`, máx 10 `recordView`/min. No silver bullet pero corta abuso casual.

---

## UI

### Footer

- Total visitas sitio: `getSiteStats()` server component, revalidate 60s.
- Top 3 historias (link + título + views): `getTopPosts(3)`, revalidate 5min.

### Historia (StoryPageClient)

- Bajo título: "leída X veces" (`uniqueViews` desde `getPostStats`).
- Badge en vivo: "● N leyendo ahora" — client component que llama `getActiveReaders` cada 15s + `pingActive` en mismo intervalo.
- LocalStorage cliente: lista de slugs leídos por este navegador. Mostrar en home "ya leíste 12 historias" (sin sincronizar entre dispositivos, eso es v2 con auth).

### Vercel Analytics — eventos custom

```ts
import { track } from '@vercel/analytics'

track('story_view', { slug, section, lang })
track('audio_listen_start', { slug })
track('audio_listen_complete', { slug, seconds })
track('scroll_complete', { slug, seconds })  // disparado en IntersectionObserver al footer del artículo
```

Esto va al panel Vercel — NO se duplica en Prisma. Prisma cuenta accesos; Vercel mide engagement.

---

## Histórico (futuro cercano)

Cron Vercel (`vercel.json`) diario 03:00 UTC:

1. Lee `ViewEvent` del día → agrega a `ViewBucket` con `period=day`.
2. Si es domingo, agrega semana. Si es día 1 mes, agrega mes. Si 1 ene, agrega año.
3. Borra `ViewEvent` con `ts < now() - 90 días` (compactación).

Endpoint admin futuro: `/admin/stats?slug=X&period=month` → gráfica.

---

## Privacidad

- Sin IP almacenada.
- `sid` cookie anónimo, no se cruza con identidad real (no hay login).
- País agregado, no individual.
- Política breve en `/privacidad`: "contamos visitas con cookie anónima para mostrar contadores; usamos Vercel Analytics sin cookies de tracking".
- UE banner: probablemente no requerido (cookie funcional + analytics propios anónimos), pero validar con jurista cuando vayas a UE seriamente.

---

## Pasos de implementación (orden)

1. Decidir: Turso vs Neon. Crear DB.
2. `pnpm add prisma @prisma/client @libsql/client @prisma/adapter-libsql @vercel/analytics`.
3. `prisma init` con datasource libsql. Pegar schema. `prisma migrate dev --name init_analytics`.
4. Middleware `src/middleware.ts` — set cookie `sid` si falta.
5. `src/lib/analytics/db.ts` — Prisma client singleton.
6. `src/lib/analytics/actions.ts` — actions arriba.
7. `src/lib/analytics/bots.ts` — regex UA.
8. `<Analytics />` en `src/app/layout.tsx`.
9. StoryPageClient: `useEffect` → `recordView(slug, section)` 1 vez. Interval `pingActive` + `getActiveReaders` cada 15s. Badge "leyendo ahora".
10. PostStats fetch + render bajo título.
11. Footer: SiteStats + TopPosts.
12. LocalStorage de slugs leídos en historia (al `recordView` exitoso → `setItem`).
13. Cron de agregación + cleanup (cuando haya volumen).

---

## Pendientes / decisiones abiertas

- ¿Turso o Neon? (impacta paso 1).
- ¿"views" cuenta cada recarga o solo primera entrada de sesión a slug? Propuesta: `uniqueViews` = primera vez; `views` = cada `recordView`. Mostrar al usuario `uniqueViews` ("leída X veces").
- ¿Ventana presencia 30s correcta? Si lectores se quedan más sin scroll, no importa porque heartbeat los mantiene.
- ¿Top 3 global o por sección? (propuesta: global en footer, por sección dentro de cada sección).
- ¿Mostrar país de lectores? (más engagement pero ruidoso).
- Versión futura — auth + comentarios + propuestas: modelo `User`, `Comment`, `EditProposal` aparte. Diseño cuando toque.
