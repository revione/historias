# Flujo de historias

Las historias viven como archivos MDX dentro de `content/historias`, separadas por idioma:

```text
content/historias/es
content/historias/en
content/historias/de
```

Cada historia debe existir con el mismo nombre de archivo en los idiomas disponibles cuando se quiera mostrar como la misma entrada traducida.

## Nombre de archivo

Formato recomendado:

```text
YYYY-MM-DD-HHMM-slug.mdx
```

Ejemplos:

```text
2026-04-19-2130-israel-estado.mdx
2026-04-20-llm-agentes.mdx
```

La app usa el nombre del archivo sin `.mdx` como `id`. El orden de lectura se basa en el nombre del archivo, por eso conviene incluir hora (`HHMM`) cuando hay varias historias el mismo dia.

## Frontmatter obligatorio

Cada archivo debe comenzar con frontmatter:

```md
---
title: Titulo visible de la historia
date: 2026-04-20
tags: [ai-agents, context-engineering, llms]
what: >
  Resumen breve de la historia, usado por la tarjeta y la vista previa.
---

# Titulo visible de la historia

Contenido en MDX.
```

Campos usados por la app:

- `title`: titulo mostrado en la UI.
- `date`: fecha en formato `YYYY-MM-DD`.
- `tags`: lista libre de tags en formato `kebab-case`.
- `what`: resumen corto de la entrada.
- `signals`, `response`, `insight`: campos opcionales para historias creadas desde la UI antigua.

## Tags

Los tags ya no estan limitados a una lista fija. Se pueden crear tags nuevos, pero conviene mantenerlos en ingles y en `kebab-case` para que sean estables entre idiomas.

Buenos ejemplos:

```text
ai-agents
context-engineering
role-prompting
biophotons
neuroscience
```

Evitar:

```text
AI Agents
context engineering
agentes
```

## Idiomas

Idiomas soportados:

```text
es
en
de
```

Para una historia nueva:

1. Crear primero la version en `content/historias/es`.
2. Traducir el mismo archivo a `content/historias/en`.
3. Traducir el mismo archivo a `content/historias/de`.
4. Mantener el mismo slug de archivo en los tres idiomas. El slug no se traduce.
5. Traducir `title` y `what`; mantener `date` y `tags`.

Ejemplo:

```text
content/historias/es/2026-04-20-llm-agentes.mdx
content/historias/en/2026-04-20-llm-agentes.mdx
content/historias/de/2026-04-20-llm-agentes.mdx
```

## Historias staged

Antes de cerrar una tanda de contenido, revisar que las historias nuevas staged tengan metadata:

```bash
git diff --cached --name-status
```

Para inspeccionar el inicio de un archivo:

```bash
sed -n '1,12p' content/historias/es/2026-04-20-llm-agentes.mdx
```

Si falta frontmatter, agregarlo antes del primer titulo Markdown.

## Validacion

Despues de agregar o modificar historias:

```bash
npm run build
```

El build valida que Next pueda leer las historias y que no haya errores de tipos o parsing.
