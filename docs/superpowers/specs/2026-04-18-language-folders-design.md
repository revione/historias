# Language Folders Design

**Date:** 2026-04-18  
**Status:** Approved

## Summary

Organize stories into per-language folders (`es`, `de`, `en`) and add a language switcher to the platform UI. Language state lives in React Context, persisted in localStorage.

## File Structure

```
content/historias/
  es/   ← existing stories migrate here
  de/
  en/
```

## Architecture

### Language Context (`src/lib/language-context.tsx`)
- `Lang` type: `'es' | 'de' | 'en'`
- `LanguageContext` with `lang` and `setLang`
- `LanguageProvider` initializes from `localStorage`, falls back to `'es'`
- `useLanguage()` hook

### Layout (`src/app/layout.tsx`)
- Wraps children with `<LanguageProvider>`

### Page (`src/app/page.tsx`)
- Server component, loads stories in `'es'` for SSR initial render
- Passes `initialStories` to `StoriesClient`

### StoriesClient (`src/app/stories-client.tsx`)
- Reads `lang` from `useLanguage()`
- On mount and lang change: calls server action `getStories(lang)`, updates local state
- Language switcher in sidebar: three buttons `ES | DE | EN`
- All UI strings read from a `T[lang]` translations object

### Stories lib (`src/lib/stories.ts`)
- All functions accept `lang: Lang` param
- `contentDir(lang)` → `content/historias/{lang}/`
- Functions: `readStories(lang)`, `writeStory(lang, filename, fields, body)`, `updateStoryFile(lang, id, updates)`, `deleteStoryFile(lang, id)`

### Actions (`src/app/actions.ts`)
- `getStories(lang)` — new, used by client on lang change
- `createStory(lang, data)`, `updateStory(lang, id, data)`, `deleteStory(lang, id)`

## Tags

Internal tag codes change from Spanish words to language-agnostic English:

| Old | New |
|-----|-----|
| `señal` | `signal` |
| `patron` | `pattern` |
| `insight` | `insight` |
| `lugar` | `place` |

Tags are stored as codes in MDX frontmatter; display labels come from `T[lang]`.

## Translations

Keys needed in each language object:

```ts
type Translations = {
  // sidebar
  newStory: string
  storiesLabel: string
  signalsLabel: string
  patternsLabel: string
  insightsLabel: string
  allStories: string
  // card sections
  whatHappened: string
  signalsNoticed: string
  howIResponded: string
  insightPattern: string
  // form
  titleLabel: string
  dateLabel: string
  tagsLabel: string
  // tag display
  tagSignal: string
  tagPattern: string
  tagInsight: string
  tagPlace: string
  // buttons / misc
  edit: string
  delete: string
  cancel: string
  save: string
  saving: string
  updating: string
  noStories: string
  newStoryTitle: string
  editStoryTitle: string
  deleteConfirm: string
  // form placeholders
  titlePlaceholder: string
  whatPlaceholder: string
  signalsPlaceholder: string
  responsePlaceholder: string
  insightPlaceholder: string
}
```

## Migration

1. Create `content/historias/es/`
2. Move existing `.mdx` files into it
3. In each file, update tags: `señal` → `signal`, `patron` → `pattern`
4. Update `Tag` type in `stories.ts`

## Data Flow on Language Change

1. User clicks `DE` in sidebar
2. `setLang('de')` updates context + localStorage
3. `useEffect` in `StoriesClient` fires, calls `getStories('de')`
4. Server Action reads `content/historias/de/`, returns stories
5. Local `stories` state updates, list re-renders in German
