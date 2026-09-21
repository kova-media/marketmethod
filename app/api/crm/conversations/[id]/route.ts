import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../../lib/db'
import { getSession } from '../../../../../lib/auth'

export async function GET(_request:NextRequest,{params}:{params:{id:string}}){
 const session=await getSession()
 if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
 const sql=getDb()
 const conversation=await sql`select c.id,c.channel,c.status,c.contact_id,co.first_name,co.last_name,co.email,co.phone from conversations c join contacts co on co.id=c.contact_id where c.id=${params.id} and c.organization_id=${session.organizationId} limit 1`
 if(!conversation[0]) return NextResponse.json({error:'Conversation not found'},{status:404})
 const messages=await sql`select id,direction,body,sent_at from messages where conversation_id=${params.id} and organization_id=${session.organizationId} order by sent_at asc limit 500`
 return NextResponse.json({conversation:conversation[0],messages})
}

export async function POST(request:NextRequest,{params}:{params:{id:string}}){
 const session=await getSession()
 if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
 const body=await request.json()
 if(!body.body?.trim()) return NextResponse.json({error:'Message body is required'},{status:400})
 const sql=getDb()
 const conversation=await sql`select id from conversations where id=${params.id} and organization_id=${session.organizationId} limit 1`
 if(!conversation[0]) return NextResponse.json({error:'Conversation not found'},{status:404})
 const rows=await sql`insert into messages(organization_id,conversation_id,direction,body) values(${session.organizationId},${params.id},'outbound',${body.body.trim()}) returning id,direction,body,sent_at`
 await sql`update conversations set updated_at=now(),status='open' where id=${params.id} and organization_id=${session.organizationId}`
 return NextResponse.json({message:rows[0]},{status:201})
}
