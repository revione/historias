export type CategoryName = 'ia' | 'espiritualidad' | 'geopolitica' | 'neurociencia' | 'social'

export const CATEGORY_TAGS: Record<CategoryName, string[]> = {
  ia: [
    'role-prompting', 'context-engineering', 'llms', 'ai-agents', 'inference',
    'tokens', 'context-rot', 'llm', 'transformer', 'embeddings', 'attention',
    'feedforward', 'kv-cache', 'context-window', 'model-architecture', 'tokenizacion',
  ],
  espiritualidad: [
    'kabbalah', 'gnosis', 'saturn', 'symbolism', 'esotericism', 'jewish-mysticism',
    'tantra', 'dzogchen', 'tummo', 'geometry', 'judaism', 'halacha', 'jewish-law',
    'torah', 'talmud', 'kashrut', 'shechita', 'food', 'ritual', 'ethics',
    'shabbat', 'melachot', 'marriage', 'conversion', 'goyim', 'rabbinic-law', 'religion',
    'christianity', 'islam', 'comparative-theology', 'jesus', 'beni-israel',
  ],
  geopolitica: [
    'israel', 'palestine', 'zionism', 'geopolitics', 'hamas', 'iran',
    'settlements', 'security', 'water', 'peace-process', 'gaza', 'united-states',
  ],
  neurociencia: [
    'nervous-system', 'biophotons', 'neuroscience', 'bioelectricity',
    'consciousness', 'vagus-nerve', 'coherence',
  ],
  social: [
    'acercamiento', 'retorica', 'tono', 'parafraseo', 'estado-alterado',
    'iniciativa', 'comunicacion', 'weed', 'señales', 'inaccion', 'fiesta',
    'presencia', 'clima', 'picardía', 'estudio',
  ],
}

export function getStoryCategories(tags: string[]): CategoryName[] {
  return (Object.keys(CATEGORY_TAGS) as CategoryName[]).filter(cat =>
    tags.some(tag => CATEGORY_TAGS[cat].includes(tag))
  )
}
