import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getDb } from '../../../../lib/db'
import { ensureSchema } from '../../../../lib/schema'

function twilioSignatureIsValid(req: NextRequest, params: Record<string, string>) {
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!token) return false

  const signature = req.headers.get('x-twilio-signature')
  if (!signature) return false

  const configuredUrl = process.env.CRM_APP_URL
  let url: string
  if (configuredUrl) {
    try {
      url = new URL('/api/webhooks/twilio', configuredUrl).toString()
    } catch {
      return false
    }
  } else {
    const proto = req.headers.get('x-forwarded-proto') || 'https'
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
    if (!host) return false
    url = proto + '://' + host + '/api/webhooks/twilio'
  }
  const data = Object.keys(params)
    .sort()
    .reduce((value, key) => value + key + params[key], url)

  const expected = crypto.createHmac('sha1', token).update(data).digest('base64')
  const actual = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer)
}

function digits(value: string) {
  return value.replace(/\D/g, '')
}

export async function POST(req: NextRequest) {
  await ensureSchema()

  const form = await req.formData()
  const params: Record<string, string> = {}
  form.forEach((value, key) => {
    params[key] = String(value)
  })

  if (!twilioSignatureIsValid(req, params)) {
    return new NextResponse('Invalid signature', { status: 403 })
  }

  const from = params.From || ''
  const to = params.To || ''
  const body = (params.Body || '').trim()

  if (!from || !to || !body) {
    return new NextResponse('Missing required Twilio fields', { status: 400 })
  }

  const sql = getDb()
  const organizations = await sql`
    select id, name
    from organizations
    where sms_from_number = ${to}
    limit 1
  `

  if (!organizations[0]) {
    return new NextResponse('No workspace configured for this number', { status: 404 })
  }

  const organizationId = organizations[0].id
  const normalizedFrom = digits(from)

  let contacts = await sql`
    select id, first_name, last_name
    from contacts
    where organization_id = ${organizationId}
      and regexp_replace(coalesce(phone,''), '\\D', '', 'g') = ${normalizedFrom}
    order by created_at asc
    limit 1
  `

  let contactId: string

  if (contacts[0]) {
    contactId = contacts[0].id
  } else {
    const created = await sql`
      insert into contacts(
        organization_id,
        first_name,
        phone,
        type,
        source,
        status
      )
      values(
        ${organizationId},
        'SMS Contact',
        ${from},
        'lead',
        'sms',
        'new'
      )
      returning id
    `
    contactId = created[0].id
  }

  let conversations = await sql`
    select id
    from conversations
    where organization_id = ${organizationId}
      and contact_id = ${contactId}
      and channel = 'sms'
      and status = 'open'
    order by updated_at desc
    limit 1
  `

  let conversationId: string

  if (conversations[0]) {
    conversationId = conversations[0].id
  } else {
    const created = await sql`
      insert into conversations(
        organization_id,
        contact_id,
        channel,
        status,
        unread_count
      )
      values(
        ${organizationId},
        ${contactId},
        'sms',
        'open',
        0
      )
      returning id
    `
    conversationId = created[0].id
  }

  const messageSid = params.MessageSid || null
  const message = await sql`
    insert into messages(
      organization_id,
      conversation_id,
      direction,
      body,
      external_id,
      metadata
    )
    values(
      ${organizationId},
      ${conversationId},
      'inbound',
      ${body},
      ${messageSid},
      ${JSON.stringify({ provider: 'twilio', messageSid, from, to })}
    )
    on conflict (organization_id, external_id) do nothing
    returning id, direction, body, sent_at
  `
  if (!message[0]) {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 200, headers: { 'Content-Type': 'text/xml' } }
    )
  }

  await sql`
    update conversations
    set
      unread_count = unread_count + 1,
      updated_at = now()
    where id = ${conversationId}
      and organization_id = ${organizationId}
  `

  await sql`
    insert into activities(
      organization_id,
      contact_id,
      type,
      title,
      body,
      metadata
    )
    values(
      ${organizationId},
      ${contactId},
      'message_received',
      'SMS received',
      ${body},
      ${JSON.stringify({
        from,
        to,
        messageSid: params.MessageSid || null
      })}
    )
  `

  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    }
  )
}
