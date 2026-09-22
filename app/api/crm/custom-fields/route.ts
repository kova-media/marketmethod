import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getSession } from '../../../../lib/auth'
import { ensureSchema } from '../../../../lib/schema'

export async function GET(req: NextRequest) {
  await ensureSchema()
  const s = getSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sql = getDb()
  const contactId = new URL(req.url).searchParams.get('contactId')

  const fields = await sql`
    select id, name, field_key, field_type
    from custom_fields
    where organization_id = ${s.organizationId}
    order by name asc
  `

  if (!contactId) return NextResponse.json({ fields })

  const values = await sql`
    select
      cf.id as custom_field_id,
      cf.name,
      cf.field_key,
      cf.field_type,
      coalesce(cfv.value, '') as value
    from custom_fields cf
    left join custom_field_values cfv
      on cfv.custom_field_id = cf.id
      and cfv.contact_id = ${contactId}
    where cf.organization_id = ${s.organizationId}
    order by cf.name asc
  `

  const contact = await sql`
    select id
    from contacts
    where id = ${contactId}
      and organization_id = ${s.organizationId}
    limit 1
  `

  if (!contact[0]) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  return NextResponse.json({ fields, values })
}

export async function POST(req: NextRequest) {
  await ensureSchema()
  const s = getSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getDb()`
    select role from users where id = ${s.userId} and organization_id = ${s.organizationId} limit 1
  `
  if (user[0]?.role !== 'owner') return NextResponse.json({ error: 'Owner access required' }, { status: 403 })

  const b = await req.json()
  const name = String(b.name || '').trim()
  const fieldKey = String(b.fieldKey || '').trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')

  if (!name || !fieldKey) return NextResponse.json({ error: 'Field name is required' }, { status: 400 })

  const sql = getDb()
  const rows = await sql`
    insert into custom_fields(organization_id,name,field_key,field_type)
    values(${s.organizationId},${name},${fieldKey},${b.fieldType || 'text'})
    on conflict (organization_id, field_key) do update set name = excluded.name, field_type = excluded.field_type
    returning id,name,field_key,field_type
  `

  return NextResponse.json({ field: rows[0] }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  await ensureSchema()
  const s = getSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const b = await req.json()
  if (!b.contactId || !b.fieldId) return NextResponse.json({ error: 'Contact and field are required' }, { status: 400 })

  const sql = getDb()
  const valid = await sql`
    select cf.id
    from custom_fields cf
    join contacts c on c.organization_id = cf.organization_id
    where cf.id = ${b.fieldId}
      and c.id = ${b.contactId}
      and cf.organization_id = ${s.organizationId}
    limit 1
  `

  if (!valid[0]) return NextResponse.json({ error: 'Field or contact not found' }, { status: 404 })

  await sql`
    insert into custom_field_values(custom_field_id,contact_id,value)
    values(${b.fieldId},${b.contactId},${String(b.value ?? '')})
    on conflict (custom_field_id,contact_id)
    do update set value = excluded.value
  `

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  await ensureSchema()
  const s = getSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getDb()`
    select role from users where id = ${s.userId} and organization_id = ${s.organizationId} limit 1
  `
  if (user[0]?.role !== 'owner') return NextResponse.json({ error: 'Owner access required' }, { status: 403 })

  const fieldId = new URL(req.url).searchParams.get('id')
  if (!fieldId) return NextResponse.json({ error: 'Field id is required' }, { status: 400 })

  const sql = getDb()
  await sql`
    delete from custom_fields
    where id = ${fieldId}
      and organization_id = ${s.organizationId}
  `

  return NextResponse.json({ ok: true })
}
