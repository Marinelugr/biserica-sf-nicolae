/** Cache mic în memorie: TTL fix, număr maxim de intrări (cea mai veche iese prima). */
export class TtlCache<V> {
  private map = new Map<string, { value: V; expires: number }>()

  constructor(private ttlMs: number, private max: number, private now: () => number = Date.now) {}

  get(key: string): V | undefined {
    const e = this.map.get(key)
    if (!e) return undefined
    if (e.expires <= this.now()) { this.map.delete(key); return undefined }
    return e.value
  }

  set(key: string, value: V): void {
    this.map.delete(key)
    this.map.set(key, { value, expires: this.now() + this.ttlMs })
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value as string)
  }

  get size(): number { return this.map.size }

  /** Valoarea din cache sau `load()`; erorile NU se păstrează în cache. */
  async getOrLoad(key: string, load: () => Promise<V>): Promise<V> {
    const hit = this.get(key)
    if (hit !== undefined) return hit
    const value = await load()
    this.set(key, value)
    return value
  }
}
