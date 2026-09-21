import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/db'
import { ensureSchema } from '../../../lib/schema'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim()
    const phone = String(body.phone || '').trim()
    const businessName = String(body.businessName || '').trim()
    const website = String(body.website || '').trim()
    const improvements = String(body.improvements || '').trim()
    const message = String(body.message || '').trim()
    const honeypot = String(body.company || '').trim()

    if (honeypot) {
      return NextResponse.json({ success: true })
    }

    if (!name || !email || !phone || !businessName) {
      return NextResponse.json({ error: 'Please complete the required fields.' }, { status: 400 })
    }

    try {
      await ensureSchema()
      const sql = getDb()
      const organizations = await sql`
        insert into organizations (name, slug, industry)
        values ('Market Method', 'market-method', 'Local Business Services')
        on conflict (slug) do update set name=excluded.name
        returning id
      `
      const organizationId = organizations[0].id
      const contacts = await sql`
        insert into contacts (organization_id, first_name, email, phone, company, source, status, notes)
        values (${organizationId}, ${name}, ${email}, ${phone}, ${businessName}, 'Website', 'new', ${[website, improvements, message].filter(Boolean).join('\\n\\n') || null})
        returning id
      `
      await sql`
        insert into activities (organization_id, contact_id, type, title, body)
        values (${organizationId}, ${contacts[0].id}, 'lead_created', 'New website lead', ${businessName})
      `
    } catch {
      // CRM persistence must not prevent the existing lead email from being delivered.
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Email delivery is not configured yet.' }, { status: 503 })
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Market Method <contact@marketmethod.co>',
        to: ['damian@kovamediagroup.com'],
        reply_to: email,
        subject: `New Lead: ${businessName}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
          `Business: ${businessName}`,
          `Website: ${website || 'Not provided'}`,
          `What they want to improve: ${improvements || 'Not specified'}`,
          '',
          'Additional information:',
          message || 'Not provided',
        ].join('\n'),
      }),
    })

    if (!emailResponse.ok) {
      return NextResponse.json({ error: 'We could not send your request. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'We could not send your request. Please try again.' }, { status: 500 })
  }
}
