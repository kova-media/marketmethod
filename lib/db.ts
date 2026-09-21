import { Pool } from 'pg'

declare global {
  var marketMethodPool: Pool | undefined
}

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not configured')
  if (!globalThis.marketMethodPool) {
    globalThis.marketMethodPool = new Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10000 })
  }
  return globalThis.marketMethodPool
}
