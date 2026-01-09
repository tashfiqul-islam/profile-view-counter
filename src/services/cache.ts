export async function getCachedBadge(kv: KVNamespace, key: string): Promise<string | null> {
  return kv.get(key, 'text')
}

export async function setCachedBadge(
  kv: KVNamespace,
  key: string,
  svg: string,
  ttlSeconds: number,
): Promise<void> {
  await kv.put(key, svg, { expirationTtl: ttlSeconds })
}
