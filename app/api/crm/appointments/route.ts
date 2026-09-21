import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getSession } from '../../../../lib/auth'

export async function GET() {
  const session=await getSession()
  if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
  const sql=getDb()
  const rows=await sql`
    select a.id,a.title,a.starts_at,a.ends_at,a.status,a.notes,a.contact_id,c.first_name,c.last_name
    from appointments a left join contacts c on c.id=a.contact_id
    where a.organization_id=${session.organizationId}
    order by a.starts_at
    limit 250
  `
  return NextResponse.json({appointments:rows})
}

export async function POST(request:NextRequest){
  const session=await getSession()
  if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
  const body=await request.json()
  if(!body.title||!body.startsAt) return NextResponse.json({error:'Title and start time are required'},{status:400})
  const sql=getDb()
  const rows=await sql`
    insert into appointments (organization_id,contact_id,assigned_to,title,starts_at,ends_at,notes)
    values (${session.organizationId},${body.contactId||null},${session.userId},${body.title},${body.startsAt},${body.endsAt||null},${body.notes||null})
    returning *
  `
  return NextResponse.json({appointment:rows[0]},{status:201})
}

export async function PATCH(request:NextRequest){
  const session=await getSession()
  if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
  const body=await request.json()
  if(!body.id||!body.status) return NextResponse.json({error:'Appointment and status are required'},{status:400})
  const sql=getDb()
  const rows=await sql`update appointments set status=${body.status} where id=${body.id} and organization_id=${session.organizationId} returning *`
  if(!rows[0]) return NextResponse.json({error:'Appointment not found'},{status:404})
  return NextResponse.json({appointment:rows[0]})
}
