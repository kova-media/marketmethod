import { NextResponse } from 'next/server'

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

    if (!name || !email || !businessName) {
      return NextResponse.json({ error: 'Please complete the required fields.' }, { status: 400 })
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
        from: 'Market Method <onboarding@resend.dev>',
        to: ['damian@kovamediagroup.com'],
        reply_to: email,
        subject: `Market Method: New Lead: ${businessName}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone || 'Not provided'}`,
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
