import { NextResponse } from 'next/server'
import { getSession } from '../../../../lib/auth'
import { getDb } from '../../../../lib/db'
import { ensureSchema } from '../../../../lib/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  await ensureSchema()
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sql = getDb()
  const rows = await sql`select c.id,c.first_name,c.last_name,c.email,c.phone,c.company,c.type,c.status,c.updated_at,coalesce(max(a.created_at),c.updated_at) as last_activity_at,floor(extract(epoch from (now() - coalesce(max(a.created_at),c.updated_at))) / 86400)::int as inactive_days from contacts c left join activities a on a.contact_id=c.id and a.organization_id=c.organization_id where c.organization_id=${session.organizationId} and c.type='customer' group by c.id having coalesce(max(a.created_at),c.updated_at) < now() - interval '90 days' order by coalesce(max(a.created_at),c.updated_at) asc limit 25`
  return NextResponse.json({ opportunities: rows })
}

export async function POST(req: Request) {
  await ensureSchema()
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const contactId = String(body.contactId || '')
  if (!contactId) return NextResponse.json({ error: 'Contact is required' }, { status: 400 })
  const sql = getDb()
  const contact = (await sql`select id,first_name,last_name from contacts where id=${contactId} and organization_id=${session.organizationId} and type='customer' limit 1`)[0]
  if (!contact) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  const existing = (await sql`select id from tasks where organization_id=${session.organizationId} and contact_id=${contactId} and completed_at is null and title='Reactivation follow-up' limit 1`)[0]
  if (existing) return NextResponse.json({ task: existing, existing: true })
  const name = [contact.first_name,contact.last_name].filter(Boolean).join(' ') || 'customer'
  const task = (await sql`insert into tasks(organization_id,contact_id,assigned_to,title,description,due_at) values(${session.organizationId},${contactId},${session.userId},'Reactivation follow-up',${'Reach out to '+name+' after 90+ days without recorded activity.'},now()) returning *`)[0]
  await sql`insert into activities(organization_id,contact_id,user_id,type,title,body) values(${session.organizationId},${contactId},${session.userId},'retention_task_created','Reactivation follow-up created','Customer flagged for reactivation.')`
  return NextResponse.json({ task }, { status: 201 })
}