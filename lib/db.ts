import { Pool } from 'pg'

declare global {
  var marketMethodPool: Pool | undefined
}

type Sql = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<any[]>
  unsafe(query: string): Promise<any[]>
}

export function getDb(): Sql {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not configured')
  if (!globalThis.marketMethodPool) {
    globalThis.marketMethodPool = new Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10000 })
  }
  const pool = globalThis.marketMethodPool
  return Object.assign(
    async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const text = strings.reduce((sql, part, index) => sql + part + (index < values.length ? '$' + (index + 1) : ''), '')
      const result = await pool.query(text, values)
      return result.rows
    },
    {
      unsafe: async (query: string) => {
        const result = await pool.query(query)
        return result.rows
      },
    },
  )
}
