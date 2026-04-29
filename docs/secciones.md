# Secciones

Las historias viven en carpetas separadas dentro de `content/`. Cada carpeta es una **sección**: un grupo independiente de historias con su propia entrada en el sidebar, su propio conteo, sus propias categorías y filtros derivados.

## Secciones actuales

| ID | Carpeta | Propósito |
|---|---|---|
| `historias` | `content/historias/` | Historias personales: vivencias, observaciones, retórica, etc. |
| `ai` | `content/ai/` | LLMs, transformers, agentes, contexto, inferencia |
| `contexto-complicado` | `content/contexto-complicado/` | Material denso o controvertido (geopolítica, religión organizada, conflictos) que se quiere acceder aparte para no saturar el flujo principal |

Cada sección replica la estructura por idioma:

```
content/<sección>/
  es/
  de/
  en/
```

## Cómo funciona

- El sidebar muestra una entrada por sección, con su conteo.
- Click en una entrada cambia la lista mostrada y limpia filtros.
- `recent` (últimas 5) y categorías + tags se calculan **dentro de la sección activa**. Cambiar de sección recalcula todo.
- Las URLs `/historia/[id]` funcionan igual sin importar la sección — el detalle busca en todas las secciones por orden de `SECTIONS` y muestra la primera que matchee.

## Registro

Toda sección está registrada en [src/lib/sections.ts](../src/lib/sections.ts):

```ts
export const SECTIONS: SectionConfig[] = [
  { id: 'historias',           dir: 'historias',           labels: { es: 'historias', de: 'Geschichten', en: 'stories' } },
  { id: 'ai',                  dir: 'ai',                  labels: { es: 'ia', de: 'KI', en: 'ai' } },
  { id: 'contexto-complicado', dir: 'contexto-complicado', labels: { es: 'contexto complicado', de: 'schwieriger Kontext', en: 'complicated context' } },
]
```

El orden del array = orden visual en el sidebar.

`DEFAULT_SECTION` es la sección activa al cargar la página.

## Agregar una sección nueva

1. **Crear carpetas**:

   ```bash
   mkdir -p content/<id>/{es,de,en}
   ```

2. **Registrar la sección** en [src/lib/sections.ts](../src/lib/sections.ts):

   - Añadir `'<id>'` al union `SectionId`.
   - Añadir un objeto al array `SECTIONS` con `id`, `dir` (nombre de carpeta) y `labels` para los tres idiomas.

3. **Mover/crear historias** dentro de la carpeta nueva, una por idioma. Mismo nombre de archivo `YYYY-MM-DD-slug.mdx` en los tres idiomas. Ver [historias.md](historias.md) para el frontmatter.

4. **(Opcional) Tags y categorías** — si las historias de la sección nueva traen tags que no existen en `src/lib/categories.ts`, agregarlos a la categoría que corresponda o crear una categoría nueva. Ver [categorias-de-acceso.md](categorias-de-acceso.md). Una categoría con cero historias en la sección activa no se muestra en el sidebar, así que no hace falta limpiar nada al cambiar de sección.

5. **Build**:

   ```bash
   pnpm build
   ```

   Valida tipos y que el parser lea las nuevas historias.

No hay nada más que tocar — `page.tsx`, `stories-client.tsx` y `historia/[id]/page.tsx` iteran `SECTIONS` automáticamente.

## Mover una historia entre secciones

Mover los tres archivos (`es`, `de`, `en`) a la carpeta destino y rebuilder. El `id` (slug) no cambia, así que las URLs `/historia/<slug>` siguen funcionando — el detalle busca en todas las secciones.

```bash
for lang in es de en; do
  mv content/historias/$lang/<slug>.mdx content/<otra-seccion>/$lang/<slug>.mdx
done
```

## Borrar una sección

1. Mover sus historias a otra sección (o borrarlas).
2. Borrar la carpeta `content/<id>/`.
3. Quitar la entrada del array `SECTIONS` y del union `SectionId` en `src/lib/sections.ts`.

Si `DEFAULT_SECTION` apunta a la sección que se borra, actualizarlo también.

## Colisiones de id entre secciones

No deberían existir — los slugs son únicos. Si llegara a ocurrir, gana la sección que aparece primero en `SECTIONS`. Para evitar ambigüedad, mantener slugs únicos en todo `content/`.
