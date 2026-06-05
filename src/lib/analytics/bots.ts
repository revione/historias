const BOT_RE = /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|embedly|quora link preview|showyoubot|outbrain|pinterest|developers\.google\.com|monitor|preview|fetch|headless|lighthouse|wget|curl|python-requests|axios|node-fetch/i

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true
  return BOT_RE.test(userAgent)
}
