import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getSession } from '../../../../lib/auth'
import { ensureSchema } from '../../../../lib/schema'
import { runAutomations } from '../../../../lib/automation'

export async function GET() {
  await ensureSchema()
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sql = getDb()
  const rows = await sql`select id,first_name,last_name,email,phone,company,type,source,status,notes,created_at,updated_at from contacts where organization_id=${session.organizationId} order by created_at desc limit 500`
  return NextResponse.json({ contacts: rows })
}

export async function POST(request: NextRequest) {
  await ensureSchema()
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const firstName = String(body.firstName || '').trim()
  if (!firstName) return NextResponse.json({ error: 'First name is required' }, { status: 400 })

  const sql = getDb()
  const email = body.email?.trim() || null
  const phone = body.phone?.trim() || null

  if (email) {
    const existing = await sql`select id,first_name,last_name,email,phone,company,type,source,status,notes,created_at,updated_at from contacts where organization_id=${session.organizationId} and lower(email)=lower(${email}) limit 1`
    if (existing[0]) return NextResponse.json({ error: 'A contact with this email already exists.', contact: existing[0] }, { status: 409 })
  }

  if (phone) {
    const existing = await sql`select id,first_name,last_name,email,phone,company,type,source,status,notes,created_at,updated_at from contacts where organization_id=${session.organizationId} and phone=${phone} limit 1`
    if (existing[0]) return NextResponse.json({ error: 'A contact with this phone number already exists.', contact: existing[0] }, { status: 409 })
  }

  const rows = await sql`insert into contacts(organization_id,first_name,last_name,email,phone,company,type,source,status,notes) values(${session.organizationId},${firstName},${body.lastName?.trim() || null},${email},${phone},${body.company?.trim() || null},${body.type === 'customer' ? 'customer' : 'lead'},${body.source || 'Manual'},${body.status || 'new'},${body.notes?.trim() || null}) returning id,first_name,last_name,email,phone,company,type,source,status,notes,created_at,updated_at`
  await sql`insert into activities(organization_id,contact_id,user_id,type,title,body) values(${session.organizationId},${rows[0].id},${session.userId},'contact_created','Customer created','Contact added manually.')`
  await runAutomations(session.organizationId, 'contact_created', rows[0].id, { status: rows[0].status, type: rows[0].type, source: rows[0].source })
  return NextResponse.json({ contact: rows[0] }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  await ensureSchema()
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Contact id is required' }, { status: 400 })

  const sql = getDb()
  const current = await sql`select * from contacts where id=${body.id} and organization_id=${session.organizationId} limit 1`
  if (!current[0]) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  const before = current[0]
  const email = body.email !== undefined ? body.email?.trim() || null : before.email
  const phone = body.phone !== undefined ? body.phone?.trim() || null : before.phone

  if (email) {
    const existing = await sql`select id from contacts where organization_id=${session.organizationId} and lower(email)=lower(${email}) and id<>${body.id} limit 1`
    if (existing[0]) return NextResponse.json({ error: 'A contact with this email already exists.' }, { status: 409 })
  }

  if (phone) {
    const existing = await sql`select id from contacts where organization_id=${session.organizationId} and phone=${phone} and id<>${body.id} limit 1`
    if (existing[0]) return NextResponse.json({ error: 'A contact with this phone number already exists.' }, { status: 409 })
  }

  const nextStatus = body.status ?? before.status
  const rows = await sql`update contacts set first_name=${body.firstName !== undefined ? body.firstName?.trim() || null : before.first_name},last_name=${body.lastName !== undefined ? body.lastName?.trim() || null : before.last_name},email=${email},phone=${phone},company=${body.company !== undefined ? body.company?.trim() || null : before.company},type=${body.type ?? before.type},status=${nextStatus},notes=${body.notes !== undefined ? body.notes?.trim() || null : before.notes},updated_at=now() where id=${body.id} and organization_id=${session.organizationId} returning id,first_name,last_name,email,phone,company,type,source,status,notes,created_at,updated_at`
  await sql`insert into activities(organization_id,contact_id,user_id,type,title,body) values(${session.organizationId},${body.id},${session.userId},'contact_updated','Customer updated','Contact details updated.')`
  if (body.status !== undefined && body.status !== before.status) await runAutomations(session.organizationId, 'status_changed', body.id, { status: nextStatus, previousStatus: before.status })
  return NextResponse.json({ contact: rows[0] })
}
