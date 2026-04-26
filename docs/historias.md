# Flujo de historias

Las historias viven como archivos MDX dentro de `content/historias`, separadas por idioma:

```text
content/historias/es
content/historias/en
content/historias/de
```

Cada historia debe existir con el mismo nombre de archivo en los idiomas disponibles cuando se quiera mostrar como la misma entrada traducida.

## Nombre de archivo

Formato:

```text
YYYY-MM-DD-slug.mdx
YYYY-MM-DD-HHMM-slug.mdx   ← usar cuando hay varias historias el mismo día
```

Ejemplos:

```text
2026-04-20-llm-agentes.mdx
2026-04-19-2130-la-vida.mdx
```

El nombre del archivo sin `.mdx` es el `id` de la historia. El orden de lectura se basa en el nombre del archivo de mayor a menor.

## Frontmatter

Cada archivo empieza con frontmatter entre `---`:

```md
---
title: Título visible de la historia
date: 2026-04-20
tags: [signal, place, ai-agents]
what: >
  Resumen breve. Se muestra en la tarjeta y como preview.
---

Cuerpo en markdown. Se muestra al expandir la historia.
```

### Campos

| Campo   | Obligatorio | Descripción                                                                  |
| ------- | ----------- | ---------------------------------------------------------------------------- |
| `title` | sí          | Título en la UI                                                              |
| `date`  | sí          | Fecha `YYYY-MM-DD`                                                           |
| `tags`  | sí          | Lista de tags (ver sección Tags)                                             |
| `what`  | sí          | Resumen corto, máximo 140 caracteres. Si está vacío, la tarjeta usa los primeros 120 chars del body |

El cuerpo (todo lo que sigue después del `---` de cierre) se renderiza como markdown al expandir la historia.

## Tags

Los tags son las palabras relevantes del texto: conceptos, temas, personas, lugares, ideas — todo lo que pueda servir de puente hacia otras historias o entradas. No son categorías, son puntos de conexión.

Al leer una historia, la pregunta es: ¿qué palabras de este texto podrían aparecer en otro texto y conectarlos? Esas son los tags.

Ejemplos de tags bien elegidos:

```text
estado-alterado       ← concepto que aparece en varias historias
iniciativa            ← patrón de comportamiento
apertura              ← señal/dinámica
retorica              ← tema de estudio
tono                  ← concepto específico dentro de retórica
parafraseo            ← técnica concreta
kabbalah              ← área de conocimiento
biophotons            ← concepto científico
Antartica             ← lugar/tema geopolítico
```

Formato: inglés o español, siempre `kebab-case`, sin espacios ni mayúsculas.

```text
estado-alterado  ✓
Estado Alterado  ✗  ← mayúsculas
estado alterado  ✗  ← espacios
```

Todos los tags aparecen tal cual en la UI (guiones reemplazados por espacios).

## Markdown en el body

El body no es MDX completo. Se renderiza con un parser interno (`mdToHtml`) que soporta:

- Títulos: `#`, `##`, `###`
- Listas: `- item` y `1. item`
- Tablas en formato pipe
- Inline: `**bold**`, `*italic*`, `` `code` ``, `[link](url)`

No soporta: componentes React, JSX, bloques de código con sintaxis highlight, HTML arbitrario.

## Idiomas

Soportados: `es`, `en`, `de`. La app carga `es` por defecto; el cambio de idioma es client-side.

Para una historia nueva:

1. Crear la versión en `content/historias/es`.
2. Copiar el archivo a `content/historias/en` y `content/historias/de`.
3. Mantener el mismo nombre de archivo en los tres idiomas. El slug no se traduce.
4. Traducir `title` y `what`; mantener `date`, `tags`, y el mismo slug.

```text
content/historias/es/2026-04-20-llm-agentes.mdx
content/historias/en/2026-04-20-llm-agentes.mdx
content/historias/de/2026-04-20-llm-agentes.mdx
```

## Antes de commitear

Verificar que cada archivo nuevo tiene frontmatter completo:

```bash
# ver qué archivos están en stage
git diff --cached --name-status

# leer el frontmatter de uno
head -15 content/historias/es/2026-04-20-llm-agentes.mdx
```

Si falta el bloque `---` al inicio, el parser lo ignora y la historia aparece sin metadata.

## Validación

```bash
npm run build
```

Valida que Next pueda leer las historias y que no haya errores de tipos o parsing.
