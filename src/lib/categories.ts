export type CategoryName = 'ia' | 'espiritualidad' | 'geopolitica' | 'neurociencia' | 'social' | 'investigaciones'

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
    'geometria-sagrada',
  ],
  geopolitica: [
    'israel', 'palestine', 'zionism', 'geopolitics', 'hamas', 'iran',
    'settlements', 'security', 'water', 'peace-process', 'gaza', 'united-states',
    'krupp', 'von-bohlen-halbach', 'alemania', 'acero', 'armamento',
    'industrializacion', 'essen', 'nazismo', 'nuremberg', 'trabajo-forzado',
    'segunda-guerra-mundial', 'primera-guerra-mundial', 'holocausto',
    'friedrich-krupp', 'alfred-krupp', 'bertha-krupp', 'gustav-krupp',
    'alfried-krupp', 'friedrich-alfred-krupp', 'kaiser-guillermo',
    'industria-belica', 'ruhr', 'dinastia-industrial', 'fundacion',
    'franco-prusiana', 'sedan', 'bismarck', 'von-moltke',
    'gran-exposicion', 'gründerzeit', 'villa-hugel', 'generalregulativ',
    'paternalismo', 'spd', 'antisindical', 'bismarck-sozialgesetze', 'führerprinzip',
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
  investigaciones: [
    'nasa', 'jpl', 'los-alamos', 'afrl', 'fbi', 'científicos-desaparecidos',
    'perfiles-científicos', 'hallazgos-científicos', 'descubrimientos', 'patentes',
    'publicaciones', 'legado', 'amy-eskridge', 'institute-for-exotic-science',
    'proyectos-activos', 'investigación-de-defensa', 'mit', 'modificación-gravitacional',
    'superconductores', 'antigravedad', 'propulsión-electrostática', 'dart',
    'defensa-planetaria', 'propulsión-exótica', 'bpp', 'grasp',
    'flujo-universal', 'modelo-unificado', 'parametro-orden', 'masa-como-flujo',
    'electron-toroidal', 'ether', 'keely', 'sympathetic-vibratory-physics',
    'davidson', 'shape-power', 'resonancia', 'energia-punto-cero', 'toroide',
    'fuerza-universal', 'dynasphere', 'atomoles', 'tono-atomico',
    'acorde-de-masa', 'dale-pond', 'musica-esferas',
  ],
}

export function getStoryCategories(tags: string[]): CategoryName[] {
  return (Object.keys(CATEGORY_TAGS) as CategoryName[]).filter(cat =>
    tags.some(tag => CATEGORY_TAGS[cat].includes(tag))
  )
}
