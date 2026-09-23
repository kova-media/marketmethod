import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getSession } from '../../../../lib/auth'
import { ensureSchema } from '../../../../lib/schema'
import { runAutomations } from '../../../../lib/automation'

const STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show']

export async function GET() {
  await ensureSchema()
  const s = getSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sql = getDb()
  const rows = await sql`select a.id,a.title,a.starts_at,a.ends_at,a.status,a.notes,a.contact_id,c.first_name,c.last_name from appointments a left join contacts c on c.id=a.contact_id and c.organization_id=a.organization_id where a.organization_id=${s.organizationId} order by a.starts_at limit 250`
  return NextResponse.json({ appointments: rows })
}

export async function POST(req: NextRequest) {
  await ensureSchema()
  const s = getSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json()
  if (!b.title || !b.startsAt) return NextResponse.json({ error: 'Title and start time are required' }, { status: 400 })
  const startsAt = new Date(b.startsAt)
  const endsAt = b.endsAt ? new Date(b.endsAt) : null
  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) return NextResponse.json({ error: 'Invalid appointment time' }, { status: 400 })
  if (endsAt && endsAt.getTime() < startsAt.getTime()) return NextResponse.json({ error: 'End time cannot be before start time' }, { status: 400 })
  const sql = getDb()
  const contactId = b.contactId || null
  if (contactId) {
    const contact = await sql`select id from contacts where id=${contactId} and organization_id=${s.organizationId} limit 1`
    if (!contact[0]) return NextResponse.json({ error: 'Contact not found' }, { status: 400 })
  }
  const rows = await sql`insert into appointments(organization_id,contact_id,assigned_to,title,starts_at,ends_at,notes) values(${s.organizationId},${contactId},${s.userId},${String(b.title).trim()},${startsAt.toISOString()},${endsAt?.toISOString() || null},${b.notes || null}) returning *`
  if (rows[0].contact_id) await runAutomations(s.organizationId, 'appointment_created', rows[0].contact_id, { status: rows[0].status, title: rows[0].title, startsAt: rows[0].starts_at })
  return NextResponse.json({ appointment: rows[0] }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  await ensureSchema()
  const s = getSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json()
  const status = String(b.status || '').trim()
  if (!b.id || !STATUSES.includes(status)) return NextResponse.json({ error: 'Appointment and valid status are required' }, { status: 400 })
  const sql = getDb()
  const before = await sql`select status,contact_id from appointments where id=${b.id} and organization_id=${s.organizationId} limit 1`
  if (!before[0]) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  const rows = await sql`update appointments set status=${status} where id=${b.id} and organization_id=${s.organizationId} returning *`
  if (status === 'completed' && before[0].status !== 'completed' && rows[0].contact_id) await runAutomations(s.organizationId, 'appointment_completed', rows[0].contact_id, { status, previousStatus: before[0].status })
  return NextResponse.json({ appointment: rows[0] })
}
