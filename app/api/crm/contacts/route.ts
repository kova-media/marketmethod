import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getSession } from '../../../../lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const sql = getDb()
    const rows = await sql`
      select id, first_name, last_name, email, phone, company, type, source, status, notes, created_at, updated_at
      from contacts
      where organization_id = ${session.organizationId}
      order by created_at desc
      limit 250
    `
    return NextResponse.json({ contacts: rows })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load contacts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, company, source, status, notes } = body
    if (!firstName) return NextResponse.json({ error: 'First name is required' }, { status: 400 })

    const sql = getDb()
    const rows = await sql`
      insert into contacts (organization_id, first_name, last_name, email, phone, company, source, status, notes)
      values (${session.organizationId}, ${firstName}, ${lastName || null}, ${email || null}, ${phone || null}, ${company || null}, ${source || 'Manual'}, ${status || 'new'}, ${notes || null})
      returning id, first_name, last_name, email, phone, company, type, source, status, notes, created_at, updated_at
    `
    await sql`
      insert into activities (organization_id, contact_id, user_id, type, title, body)
      values (${session.organizationId}, ${rows[0].id}, ${session.userId}, 'contact_created', 'Customer created', 'Contact added manually.')
    `
    return NextResponse.json({ contact: rows[0] }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create contact'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
