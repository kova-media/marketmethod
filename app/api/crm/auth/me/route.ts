import { NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getSession } from '../../../../lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null }, { status: 401 })
  const sql = getDb()
  const rows = await sql`
    select u.id, u.email, u.name, u.role, o.id as organization_id, o.name as organization_name, o.industry
    from users u join organizations o on o.id=u.organization_id
    where u.id=${session.userId} and u.organization_id=${session.organizationId}
    limit 1
  `
  if (!rows[0]) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({ user: rows[0] })
}
