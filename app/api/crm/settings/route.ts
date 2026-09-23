import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getAuthenticatedSession } from '../../../../lib/authenticated'
import { ensureSchema } from '../../../../lib/schema'

function validEmail(value: unknown) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))
}

export async function GET() {
  await ensureSchema()
  const s = await getAuthenticatedSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sql = getDb()
  const currentUser = (await sql`select id,name,email,role from users where id=${s.userId} and organization_id=${s.organizationId} limit 1`)[0]
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [org, users, stages] = await Promise.all([
    sql`select id,name,slug,industry,logo_url,primary_color,sender_name,sender_email,reply_to_email,sms_from_number from organizations where id=${s.organizationId}`,
    sql`select id,name,email,role,created_at from users where organization_id=${s.organizationId} order by created_at`,
    sql`select id,name,position,color from pipeline_stages where organization_id=${s.organizationId} order by position`
  ])
  return NextResponse.json({ currentUser, organization: org[0], users, stages, integrations: { emailSending: !!process.env.RESEND_API_KEY, emailInbound: !!process.env.RESEND_API_KEY && !!process.env.RESEND_WEBHOOK_SECRET, smsSending: !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN && !!org[0]?.sms_from_number } })
}

export async function PATCH(req: NextRequest) {
  await ensureSchema()
  const s = await getAuthenticatedSession()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sql = getDb()
  const user = await sql`select role from users where id=${s.userId} and organization_id=${s.organizationId} limit 1`
  if (user[0]?.role !== 'owner') return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  const b = await req.json()
  if (!validEmail(b.senderEmail) || !validEmail(b.replyToEmail)) return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  if (b.smsFromNumber && !/^\+?[1-9]\d{6,14}$/.test(String(b.smsFromNumber).replace(/[\s()-]/g, ''))) return NextResponse.json({ error: 'Invalid SMS number' }, { status: 400 })
  if (b.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(String(b.primaryColor))) return NextResponse.json({ error: 'Invalid primary color' }, { status: 400 })
  const rows = await sql`update organizations set name=${String(b.name || '').trim().slice(0,200)||'Business'},industry=${String(b.industry || '').trim().slice(0,120)||null},primary_color=${b.primaryColor||'#C7ED63'},logo_url=${String(b.logoUrl || '').trim().slice(0,1000)||null},sender_name=${String(b.senderName || '').trim().slice(0,200)||null},sender_email=${String(b.senderEmail || '').trim().toLowerCase()||null},reply_to_email=${String(b.replyToEmail || '').trim().toLowerCase()||null},sms_from_number=${b.smsFromNumber ? String(b.smsFromNumber).replace(/[\s()-]/g,'') : null} where id=${s.organizationId} returning id,name,slug,industry,logo_url,primary_color,sender_name,sender_email,reply_to_email,sms_from_number`
  return NextResponse.json({ organization: rows[0] })
}
