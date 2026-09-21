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
    if (!firstName?.trim()) return NextResponse.json({ error: 'First name is required' }, { status: 400 })

    const sql = getDb()
    const rows = await sql`
      insert into contacts (organization_id, first_name, last_name, email, phone, company, source, status, notes)
      values (${session.organizationId}, ${firstName.trim()}, ${lastName?.trim() || null}, ${email?.trim() || null}, ${phone?.trim() || null}, ${company?.trim() || null}, ${source || 'Manual'}, ${status || 'new'}, ${notes?.trim() || null})
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

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'Contact id is required' }, { status: 400 })

    const sql = getDb()
    const existing = await sql`
      select id from contacts
      where id=${body.id} and organization_id=${session.organizationId}
      limit 1
    `
    if (!existing[0]) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

    const rows = await sql`
      update contacts
      set first_name=${body.firstName?.trim() || undefined},
          last_name=${body.lastName?.trim() || null},
          email=${body.email?.trim() || null},
          phone=${body.phone?.trim() || null},
          company=${body.company?.trim() || null},
          status=${body.status || 'new'},
          notes=${body.notes?.trim() || null},
          updated_at=now()
      where id=${body.id} and organization_id=${session.organizationId}
      returning id, first_name, last_name, email, phone, company, type, source, status, notes, created_at, updated_at
    `

    await sql`
      insert into activities (organization_id, contact_id, user_id, type, title, body, metadata)
      values (${session.organizationId}, ${body.id}, ${session.userId}, 'contact_updated', 'Customer updated', 'Contact details were updated.', ${JSON.stringify({ fields: Object.keys(body).filter(key => key !== 'id') })})
    `

    return NextResponse.json({ contact: rows[0] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update contact'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
