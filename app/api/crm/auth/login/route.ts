import { ensureSchema } from '../../../../../lib/schema'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { createSession, verifyPassword } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })

    await ensureSchema()\n    const sql = getDb()
    const rows = await sql`
      select u.id, u.organization_id, u.email, u.name, u.role, u.password_hash, o.name as organization_name
      from users u
      join organizations o on o.id = u.organization_id
      where lower(u.email) = lower(${email.trim()})
      limit 1
    `
    const user = rows[0]
    if (!user?.password_hash || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    await createSession(user.id, user.organization_id)
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      organization: { id: user.organization_id, name: user.organization_name },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sign in'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
