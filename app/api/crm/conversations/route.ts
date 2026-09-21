import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request:NextRequest){
  const session=await getSession()
  if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
  const body=await request.json()
  if(!body.contactId||!body.channel) return NextResponse.json({error:'Contact and channel are required'},{status:400})
  const sql=getDb()
  const contact=await sql`select id from contacts where id=${body.contactId} and organization_id=${session.organizationId} limit 1`
  if(!contact[0]) return NextResponse.json({error:'Contact not found'},{status:404})
  const existing=await sql`select id from conversations where organization_id=${session.organizationId} and contact_id=${body.contactId} and channel=${body.channel} and status='open' order by updated_at desc limit 1`
  if(existing[0]) return NextResponse.json({conversation:{id:existing[0].id}})
  const rows=await sql`insert into conversations(organization_id,contact_id,channel) values(${session.organizationId},${body.contactId},${body.channel}) returning *`
  return NextResponse.json({conversation:rows[0]},{status:201})
}
