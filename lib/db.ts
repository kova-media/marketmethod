import { neon } from '@neondatabase/serverless'

type Sql = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<any[]>
  unsafe(query: string, values?: unknown[]): Promise<any[]>
}

let database: Sql | undefined

export function getDb(): Sql {
  if (database) return database
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not configured')

  const client: any = neon(url)

  database = Object.assign(
    async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const query = strings.reduce(
        (sql, part, index) => sql + part + (index < values.length ? '$' + (index + 1) : ''),
        '',
      )
      return client(query, values)
    },
    {
      unsafe: async (query: string, values: unknown[] = []) => client(query, values),
    },
  )

  return database
}
