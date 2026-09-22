import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getDb } from '../../../../lib/db'
import { ensureSchema } from '../../../../lib/schema'

function verifyWebhook(req: NextRequest, payload: string) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  const id = req.headers.get('svix-id')
  const timestamp = req.headers.get('svix-timestamp')
  const signature = req.headers.get('svix-signature')

  if (!secret || !id || !timestamp || !signature) return false

  const timestampNumber = Number(timestamp)
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false

  const rawSecret = secret.replace(/^whsec_/, '')
  const secretBytes = Buffer.from(rawSecret, 'base64')
  const signed = id + '.' + timestamp + '.' + payload
  const expected = crypto.createHmac('sha256', secretBytes).update(signed).digest('base64')

  return signature
    .split(' ')
    .map(value => value.split(',')[1])
    .filter(Boolean)
    .some(value => {
      try {
        return crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected))
      } catch {
        return false
      }
    })
}

function emailAddress(value: string) {
  const match = value.match(/<([^>]+)>/)
  return (match?.[1] || value).trim().toLowerCase()
}

export async function POST(req: NextRequest) {
  await ensureSchema()

  const payload = await req.text()
  if (!verifyWebhook(req, payload)) {
    return new NextResponse('Invalid webhook', { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(payload)
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 })
  }

  if (event.type !== 'email.received') {
    return NextResponse.json({ received: true })
  }

  const data = event.data || {}
  const from = emailAddress(String(data.from || ''))
  const recipients = Array.isArray(data.to) ? data.to.map((value: string) => emailAddress(String(value))) : []

  if (!from || !recipients.length || !data.email_id) {
    return NextResponse.json({ error: 'Incomplete email event' }, { status: 400 })
  }

  const sql = getDb()

  const organization = (await sql`
    select id, name, sender_email, reply_to_email
    from organizations
    where lower(sender_email) = any(${recipients})
       or lower(reply_to_email) = any(${recipients})
    limit 1
  `)[0]

  if (!organization) {
    return NextResponse.json({ received: true, matched: false })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 503 })
  }

  const existing = await sql`
    select id
    from messages
    where organization_id = ${organization.id}
      and external_id = ${String(data.email_id)}
    limit 1
  `

  if (existing[0]) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  const emailResponse = await fetch(
    'https://api.resend.com/emails/' + encodeURIComponent(String(data.email_id)),
    {
      headers: {
        Authorization: 'Bearer ' + apiKey
      }
    }
  )

  if (!emailResponse.ok) {
    return NextResponse.json({ error: 'Could not retrieve received email' }, { status: 502 })
  }

  const email = await emailResponse.json()
  const body = String(email.text || email.html || data.subject || '').trim()
  const subject = String(email.subject || data.subject || '').trim()

  if (!body) {
    return NextResponse.json({ error: 'Received email has no message body' }, { status: 400 })
  }

  let contact = (await sql`
    select id
    from contacts
    where organization_id = ${organization.id}
      and lower(email) = ${from}
    order by created_at asc
    limit 1
  `)[0]

  if (!contact) {
    contact = (await sql`
      insert into contacts(
        organization_id,
        first_name,
        email,
        type,
        source,
        status
      )
      values(
        ${organization.id},
        'Email Contact',
        ${from},
        'lead',
        'email',
        'new'
      )
      returning id
    `)[0]
  }

  let conversation = (await sql`
    select id
    from conversations
    where organization_id = ${organization.id}
      and contact_id = ${contact.id}
      and channel = 'email'
      and status = 'open'
    order by updated_at desc
    limit 1
  `)[0]

  if (!conversation) {
    conversation = (await sql`
      insert into conversations(
        organization_id,
        contact_id,
        channel,
        status,
        unread_count
      )
      values(
        ${organization.id},
        ${contact.id},
        'email',
        'open',
        0
      )
      returning id
    `)[0]
  }

  await sql`
    insert into messages(
      organization_id,
      conversation_id,
      direction,
      body,
      subject,
      external_id,
      metadata
    )
    values(
      ${organization.id},
      ${conversation.id},
      'inbound',
      ${body},
      ${subject || null},
      ${String(data.email_id)},
      ${JSON.stringify({
        messageId: data.message_id || email.message_id || null,
        from,
        to: recipients
      })}
    )
  `

  await sql`
    update conversations
    set
      unread_count = unread_count + 1,
      updated_at = now()
    where id = ${conversation.id}
      and organization_id = ${organization.id}
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
      ${organization.id},
      ${contact.id},
      'message_received',
      'Email received',
      ${body},
      ${JSON.stringify({
        subject,
        from,
        to: recipients,
        emailId: data.email_id
      })}
    )
  `

  return NextResponse.json({ received: true, matched: true })
}
