import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../../lib/db'
import { hashPassword, createSession } from '../../../../../lib/auth'
import { ensureSchema } from '../../../../../lib/schema'

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

export async function POST(request: NextRequest) {
  await ensureSchema()
  const body = await request.json()
  const businessName = body.businessName?.trim()
  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password || ''

  if (!businessName || !name || !email || !password) {
    return NextResponse.json({ error: 'Business name, name, email, and password are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const sql = getDb()
  const isMarketMethod = businessName.toLowerCase() === 'market method'
  const slug = isMarketMethod ? 'market-method' : (slugify(businessName) || 'workspace') + '-' + Math.random().toString(36).slice(2, 7)

  try {
    let organizationId: string
    const existingOrg = isMarketMethod
      ? await sql`select id from organizations where slug='market-method' limit 1`
      : []

    if (existingOrg[0]) {
      organizationId = existingOrg[0].id
    } else {
      const orgRows = await sql`insert into organizations(name,slug,industry,primary_color) values(${businessName},${slug},${body.industry?.trim() || null},'#C7ED63') returning id`
      organizationId = orgRows[0].id
    }

    const existingUser = await sql`select id from users where organization_id=${organizationId} and email=${email} limit 1`
    if (existingUser[0]) {
      return NextResponse.json({ error: 'An account with this email already exists in this workspace.' }, { status: 409 })
    }

    const userRows = await sql`insert into users(organization_id,email,name,role,password_hash) values(${organizationId},${email},${name},'owner',${hashPassword(password)}) returning id,email,name,role`

    const stageCount = await sql`select count(*)::int as count from pipeline_stages where organization_id=${organizationId}`
    if (!stageCount[0]?.count) {
      for (const [stage, position] of [['New', 1], ['Contacted', 2], ['Qualified', 3], ['Won', 4]] as const) {
        await sql`insert into pipeline_stages(organization_id,name,position) values(${organizationId},${stage},${position})`
      }
    }

    await createSession(userRows[0].id, organizationId)
    return NextResponse.json({ user: userRows[0] }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create workspace'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
