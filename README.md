# // diario — historial de historias

App local en Next.js para guardar y revisar tus historias, señales y patrones.

## Instalación

```bash
cd historias-app
npm install
npm run dev
```

Abre http://localhost:3000 en el navegador.

## Cómo funciona

- Las historias se guardan como archivos MDX en `content/historias/{es,en,de}`
- No necesitas base de datos ni internet
- Puedes hacer backup del directorio `content/historias` cuando quieras

## Documentación

- [Flujo de historias](docs/historias.md)

## Campos por historia

- **Qué pasó** — el hecho crudo, la situación
- **Señales que noté** — lo que ella hizo, dijo, cómo se movió
- **Cómo respondí** — lo que hiciste o no hiciste
- **Insight / patrón** — qué aprendiste, qué se repite

## Etiquetas

- Las etiquetas son libres y se guardan en el frontmatter de cada MDX
- Se recomienda usar `kebab-case` en inglés para mantenerlas estables entre idiomas
- La UI sigue destacando tags base como `signal`, `pattern`, `insight` y `place`
