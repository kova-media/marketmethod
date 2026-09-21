import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getSession } from '../../../../lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const contactId = new URL(request.url).searchParams.get('contactId')
  if (!contactId) return NextResponse.json({ error: 'contactId is required' }, { status: 400 })

  const sql = getDb()
  const rows = await sql`
    select a.id,a.type,a.title,a.body,a.metadata,a.created_at,u.name as user_name
    from activities a
    left join users u on u.id=a.user_id
    where a.organization_id=${session.organizationId} and a.contact_id=${contactId}
    order by a.created_at desc
    limit 100
  `
  return NextResponse.json({ activities: rows })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.contactId || !body.title) return NextResponse.json({ error: 'Contact and title are required' }, { status: 400 })

  const sql = getDb()
  const contact = await sql`select id from contacts where id=${body.contactId} and organization_id=${session.organizationId} limit 1`
  if (!contact[0]) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  const rows = await sql`
    insert into activities (organization_id,contact_id,user_id,type,title,body)
    values (${session.organizationId},${body.contactId},${session.userId},${body.type || 'note'},${body.title},${body.body || null})
    returning id,type,title,body,metadata,created_at
  `
  return NextResponse.json({ activity: rows[0] }, { status: 201 })
}
