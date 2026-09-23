import { NextResponse } from 'next/server'
import { getSession } from '../../../../lib/auth'
import { getDb } from '../../../../lib/db'
import { ensureSchema } from '../../../../lib/schema'

export async function GET() {
  await ensureSchema()
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sql = getDb()
  const rows = await sql`
    select c.id,c.first_name,c.last_name,c.email,c.phone,c.company,c.type,c.status,c.updated_at,
      max(a.created_at) as last_activity_at
    from contacts c
    left join activities a on a.contact_id=c.id and a.organization_id=c.organization_id
    where c.organization_id=${session.organizationId}
      and c.type='customer'
    group by c.id
    having coalesce(max(a.created_at),c.updated_at) < now() - interval '90 days'
    order by coalesce(max(a.created_at),c.updated_at) asc
    limit 25
  `
  return NextResponse.json({ opportunities: rows })
}
