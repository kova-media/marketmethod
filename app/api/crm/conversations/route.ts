import { NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getSession } from '../../../../lib/auth'

export async function GET() {
  const session=await getSession()
  if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
  const sql=getDb()
  const rows=await sql`
    select c.id,c.channel,c.status,c.created_at,c.updated_at,
           co.id as contact_id,co.first_name,co.last_name,co.email,co.phone
    from conversations c join contacts co on co.id=c.contact_id
    where c.organization_id=${session.organizationId}
    order by c.updated_at desc
    limit 250
  `
  return NextResponse.json({conversations:rows})
}
