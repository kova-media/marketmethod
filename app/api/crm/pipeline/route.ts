import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getAuthenticatedSession } from '../../../../lib/authenticated'
import { ensureSchema } from '../../../../lib/schema'
import { runAutomations } from '../../../../lib/automation'

export async function GET() {
  await ensureSchema()
  const s = await getAuthenticatedSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sql = getDb()
  const [stages, contacts] = await Promise.all([
    sql`select id,name,position,color from pipeline_stages where organization_id=${s.organizationId} order by position`,
    sql`select id,first_name,last_name,email,phone,company,source,status,created_at from contacts where organization_id=${s.organizationId} order by created_at desc limit 500`
  ])
  return NextResponse.json({ stages, contacts })
}

export async function PATCH(req: NextRequest) {
  await ensureSchema()
  const s = await getAuthenticatedSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json()
  const contactId = String(b.contactId || '')
  const status = String(b.status || '').trim()
  if (!contactId || !status) return NextResponse.json({ error: 'Contact and stage are required' }, { status: 400 })
  const sql = getDb()
  const [contact, stage] = await Promise.all([
    sql`select id,status from contacts where id=${contactId} and organization_id=${s.organizationId} limit 1`,
    sql`select id,name from pipeline_stages where organization_id=${s.organizationId} and (id::text=${status} or slug=${status} or name=${status}) limit 1`
  ])
  if (!contact[0]) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  if (!stage[0]) return NextResponse.json({ error: 'Invalid pipeline stage' }, { status: 400 })
  const nextStatus = stage[0].name
  if (contact[0].status === nextStatus) return NextResponse.json({ contact: { id: contactId, status: nextStatus }, changed: false })
  const rows = await sql`update contacts set status=${nextStatus},updated_at=now() where id=${contactId} and organization_id=${s.organizationId} returning id,status`
  await sql`insert into activities(organization_id,contact_id,user_id,type,title,body) values(${s.organizationId},${contactId},${s.userId},'status_changed','Pipeline stage changed',${'Moved from '+contact[0].status+' to '+nextStatus})`
  await runAutomations(s.organizationId, 'status_changed', contactId, { status: nextStatus, previousStatus: contact[0].status })
  return NextResponse.json({ contact: rows[0], changed: true })
}
