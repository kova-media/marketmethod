import { getDb } from './db'
import { getSession } from './auth'

export async function getAuthenticatedSession() {
  const session = getSession()
  if (!session) return null

  const sql = getDb()
  const rows = await sql`
    select u.id,u.organization_id
    from users u
    join organizations o on o.id=u.organization_id
    where u.id=${session.userId}
      and u.organization_id=${session.organizationId}
    limit 1
  `

  return rows[0] ? session : null
}
