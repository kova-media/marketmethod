import { ensureSchema } from '../../../../../lib/schema'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { createSession, hashPassword } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessName, name, email, password, industry } = body
    if (!businessName || !name || !email || !password) return NextResponse.json({ error: 'Business name, name, email, and password are required' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    await ensureSchema()\n    const sql = getDb()
    const slugBase = businessName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'business'
    const slug = `${slugBase}-${randomSuffix()}`
    const orgRows = await sql`
      insert into organizations (name, slug, industry)
      values (${businessName}, ${slug}, ${industry || null})
      returning id, name, slug
    `
    const org = orgRows[0]
    const userRows = await sql`
      insert into users (organization_id, email, name, role, password_hash)
      values (${org.id}, ${email.toLowerCase().trim()}, ${name}, 'owner', ${hashPassword(password)})
      returning id, email, name, role
    `
    for (const [position, stage] of ['New', 'Contacted', 'Qualified', 'Won'].entries()) {
      await sql`insert into pipeline_stages (organization_id, name, position) values (${org.id}, ${stage}, ${position + 1})`
    }
    await createSession(userRows[0].id, org.id)
    return NextResponse.json({ user: userRows[0], organization: org }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create account'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8)
}
