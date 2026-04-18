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

- Las historias se guardan en `data/stories.json` en tu máquina
- No necesitas base de datos ni internet
- Puedes hacer backup del archivo JSON cuando quieras

## Campos por historia

- **Qué pasó** — el hecho crudo, la situación
- **Señales que noté** — lo que ella hizo, dijo, cómo se movió
- **Cómo respondí** — lo que hiciste o no hiciste
- **Insight / patrón** — qué aprendiste, qué se repite

## Etiquetas

- `Señal recibida` — ella dio señales
- `Patrón propio` — algo que se repite en ti
- `Insight` — aprendizaje claro
- `Lugar` — contexto de lugar relevante
