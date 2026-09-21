import { ensureSchema } from '../../../../lib/schema'
import { NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'

export async function GET() {
  try {\n    await ensureSchema()
    const sql = getDb()
    const result = await sql`select now() as database_time`
    return NextResponse.json({ ok: true, databaseTime: result[0]?.database_time ?? null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed'
    return NextResponse.json({ ok: false, error: message }, { status: 503 })
  }
}
