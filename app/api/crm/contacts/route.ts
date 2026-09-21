import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get('organizationId')
  if (!organizationId) return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })

  try {
    const sql = getDb()
    const rows = await sql`
      select id, first_name, last_name, email, phone, company, type, source, status, notes, created_at, updated_at
      from contacts
      where organization_id = ${organizationId}
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
  try {
    const body = await request.json()
    const { organizationId, firstName, lastName, email, phone, company, source, status, notes } = body
    if (!organizationId || !firstName) return NextResponse.json({ error: 'organizationId and firstName are required' }, { status: 400 })

    const sql = getDb()
    const rows = await sql`
      insert into contacts (organization_id, first_name, last_name, email, phone, company, source, status, notes)
      values (${organizationId}, ${firstName}, ${lastName || null}, ${email || null}, ${phone || null}, ${company || null}, ${source || 'Manual'}, ${status || 'new'}, ${notes || null})
      returning id, first_name, last_name, email, phone, company, type, source, status, notes, created_at, updated_at
    `
    await sql`
      insert into activities (organization_id, contact_id, type, title, body)
      values (${organizationId}, ${rows[0].id}, 'contact_created', 'Customer created', 'Contact added manually.')
    `
    return NextResponse.json({ contact: rows[0] }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create contact'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
