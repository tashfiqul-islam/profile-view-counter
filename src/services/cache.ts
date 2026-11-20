/**
 * Reads a rendered badge from the KV cache.
 *
 * @param kv - The `CACHE` KV binding.
 * @param key - Cache key, `badge:<username>`.
 * @returns The cached SVG, or `null` on a miss.
 */
export function getCachedBadge(kv: KVNamespace, key: string): Promise<string | null> {
  return kv.get(key, "text");
}

/**
 * Stores a rendered badge in the KV cache.
 *
 * @param kv - The `CACHE` KV binding.
 * @param key - Cache key, `badge:<username>`.
 * @param svg - The rendered badge.
 * @param ttlSeconds - Expiry in seconds (KV's minimum is 60).
 * @returns Resolves once KV accepted the write.
 */
export async function setCachedBadge(
  kv: KVNamespace,
  key: string,
  svg: string,
  ttlSeconds: number,
): Promise<void> {
  await kv.put(key, svg, { expirationTtl: ttlSeconds });
}
