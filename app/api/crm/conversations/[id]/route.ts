import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../../lib/db'
import { getSession } from '../../../../../lib/auth'
import { ensureSchema } from '../../../../../lib/schema'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await ensureSchema()
  const s = getSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sql = getDb()
  const c = await sql`
    select
      c.id,
      c.channel,
      c.status,
      c.unread_count,
      c.contact_id,
      co.first_name,
      co.last_name,
      co.email,
      co.phone
    from conversations c
    join contacts co on co.id = c.contact_id
    where c.id = ${params.id}
      and c.organization_id = ${s.organizationId}
    limit 1
  `

  if (!c[0]) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  const messages = await sql`
    select id, direction, body, subject, external_id, sent_at
    from messages
    where conversation_id = ${params.id}
      and organization_id = ${s.organizationId}
    order by sent_at asc
    limit 500
  `

  return NextResponse.json({ conversation: c[0], messages })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await ensureSchema()
  const s = getSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const b = await req.json().catch(() => ({}))
  const sql = getDb()

  const existing = await sql`
    select id, status
    from conversations
    where id = ${params.id}
      and organization_id = ${s.organizationId}
    limit 1
  `

  if (!existing[0]) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  if (b.action === 'mark_read') {
    await sql`
      update conversations
      set unread_count = 0
      where id = ${params.id}
        and organization_id = ${s.organizationId}
    `
  } else if (b.action === 'close') {
    await sql`
      update conversations
      set status = 'closed', updated_at = now()
      where id = ${params.id}
        and organization_id = ${s.organizationId}
    `
  } else if (b.action === 'reopen') {
    await sql`
      update conversations
      set status = 'open', updated_at = now()
      where id = ${params.id}
        and organization_id = ${s.organizationId}
    `
  } else {
    return NextResponse.json({ error: 'Unsupported conversation action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await ensureSchema()
  const s = getSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const b = await req.json()
  if (!b.body?.trim()) return NextResponse.json({ error: 'Message body is required' }, { status: 400 })

  const sql = getDb()
  const c = await sql`
    select
      c.id,
      c.channel,
      co.email,
      co.phone,
      co.first_name,
      co.last_name,
      o.name as organization_name,
      o.sender_name,
      o.sender_email,
      o.reply_to_email,
      o.sms_from_number
    from conversations c
    join contacts co on co.id = c.contact_id
    join organizations o on o.id = c.organization_id
    where c.id = ${params.id}
      and c.organization_id = ${s.organizationId}
    limit 1
  `

  if (!c[0]) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  const text = b.body.trim()
  let providerMessageId: string | null = null

  if (c[0].channel === 'email') {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Email sending is not configured.' }, { status: 503 })
    if (!c[0].email) return NextResponse.json({ error: 'This contact does not have an email address.' }, { status: 400 })
    if (!c[0].sender_email) return NextResponse.json({ error: 'Set a sender email in Settings before sending email.' }, { status: 400 })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: (c[0].sender_name || c[0].organization_name) + ' <' + c[0].sender_email + '>',
        to: [c[0].email],
        reply_to: c[0].reply_to_email || c[0].sender_email,
        subject: b.subject?.trim() || 'Message from ' + c[0].organization_name,
        text
      })
    })

    if (!response.ok) {
      const detail = await response.text()
      return NextResponse.json({ error: 'Email could not be sent.', detail }, { status: 502 })
    }
    const emailResult = await response.json().catch(() => ({}))
    providerMessageId = emailResult.id || null
  } else if (c[0].channel === 'sms') {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN

    if (!sid || !token || !c[0].sms_from_number) {
      return NextResponse.json({ error: 'SMS sending is not configured. Connect a texting number in Settings.' }, { status: 503 })
    }

    if (!c[0].phone) {
      return NextResponse.json({ error: 'This contact does not have a phone number.' }, { status: 400 })
    }

    const auth = Buffer.from(sid + ':' + token).toString('base64')
    const response = await fetch(
      'https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json',
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + auth,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: c[0].phone,
          From: c[0].sms_from_number,
          Body: text
        }).toString()
      }
    )

    if (!response.ok) {
      const detail = await response.text()
      return NextResponse.json({ error: 'SMS could not be sent.', detail }, { status: 502 })
    }
    const smsResult = await response.json().catch(() => ({}))
    providerMessageId = smsResult.sid || null
  }

  const messageSubject = c[0].channel === 'email' ? (b.subject?.trim() || 'Message from ' + c[0].organization_name) : null

  const rows = await sql`
    insert into messages(organization_id, conversation_id, direction, body, subject, external_id, metadata)
    values(${s.organizationId}, ${params.id}, 'outbound', ${text}, ${messageSubject}, ${providerMessageId}, ${JSON.stringify({ provider: c[0].channel })})
    returning id, direction, body, subject, external_id, sent_at
  `

  await sql`
    update conversations
    set
      updated_at = now(),
      unread_count = 0
    where id = ${params.id}
      and organization_id = ${s.organizationId}
  `

  await sql`
    insert into activities(organization_id, contact_id, user_id, type, title, body)
    select
      organization_id,
      contact_id,
      ${s.userId},
      'message_sent',
      'Message sent',
      ${text}
    from conversations
    where id = ${params.id}
      and organization_id = ${s.organizationId}
  `

  return NextResponse.json({ message: rows[0] }, { status: 201 })
}
