# Categorías de acceso

El sidebar agrupa las historias en categorías derivadas de sus tags. Una historia puede aparecer en varias categorías simultáneamente si sus tags cruzan grupos.

## Estructura del sidebar

```
N  historias          ← click = mostrar todas, limpiar filtro
──────────────────
últimas               ← sección informativa
  título 1
  título 2
  título 3
  título 4
  título 5
──────────────────
N  ia                 ← click = filtrar por categoría
   (hover revela subcategorías con conteo)
   n  role-prompting
   n  context-engineering
   ...
N  espiritualidad
N  geopolitica
N  neurociencia
N  social
──────────────────
+ nueva historia
```

## Categorías actuales

| Categoría | Descripción |
|---|---|
| `ia` | LLMs, context engineering, inference, arquitectura de modelos |
| `espiritualidad` | Kabbalah, gnosis, judaísmo, tantra, dzogchen, ritual |
| `geopolitica` | Israel, Palestina, geopolítica, actores regionales |
| `neurociencia` | Sistema nervioso, biofotones, consciencia, bioelectricidad |
| `social` | Interacción, retórica, acercamiento, comunicación |

## Cómo se asignan las categorías

No hay un campo `category` en el frontmatter. Las categorías se derivan automáticamente de los tags de la historia via el mapa en `src/lib/categories.ts`.

Si una historia tiene tags de dos categorías distintas (ej. `israel` + `kabbalah`), aparece en ambas.

## Agregar una nueva historia a las categorías

Al crear una historia nueva, verificar que sus tags estén en el mapa de categorías:

1. Abrir `src/lib/categories.ts`
2. Revisar si los tags de la historia están mapeados en alguna categoría
3. Si el tag es nuevo y no está mapeado, agregarlo a la categoría que corresponda
4. Si el tema no encaja en ninguna categoría existente, crear una nueva categoría en el mismo archivo

```ts
export const CATEGORY_TAGS: Record<CategoryName, string[]> = {
  ia: ['role-prompting', 'llms', ...],
  espiritualidad: ['kabbalah', 'gnosis', ...],
  // agregar nueva categoría aquí
}
```

## Tags sin categoría

Los tags que no están en `CATEGORY_TAGS` no aparecen en el sidebar, pero siguen existiendo en los archivos y funcionando como puntos de conexión entre historias. No es obligatorio que todos los tags tengan categoría.
