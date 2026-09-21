import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getSession } from '../../../../lib/auth'

export async function GET() {
  const session=await getSession()
  if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
  const sql=getDb()
  const rows=await sql`
    select t.id,t.title,t.description,t.due_at,t.completed_at,t.contact_id,c.first_name,c.last_name
    from tasks t left join contacts c on c.id=t.contact_id
    where t.organization_id=${session.organizationId}
    order by t.completed_at nulls first,t.due_at nulls last
    limit 250
  `
  return NextResponse.json({tasks:rows})
}

export async function POST(request:NextRequest){
  const session=await getSession()
  if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
  const body=await request.json()
  if(!body.title) return NextResponse.json({error:'Title is required'},{status:400})
  const sql=getDb()
  const rows=await sql`
    insert into tasks (organization_id,contact_id,assigned_to,title,description,due_at)
    values (${session.organizationId},${body.contactId||null},${session.userId},${body.title},${body.description||null},${body.dueAt||null})
    returning *
  `
  return NextResponse.json({task:rows[0]},{status:201})
}

export async function PATCH(request:NextRequest){
  const session=await getSession()
  if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
  const body=await request.json()
  if(!body.id) return NextResponse.json({error:'Task id is required'},{status:400})
  const sql=getDb()
  const rows=await sql`update tasks set completed_at=${body.completed ? new Date().toISOString() : null} where id=${body.id} and organization_id=${session.organizationId} returning *`
  if(!rows[0]) return NextResponse.json({error:'Task not found'},{status:404})
  return NextResponse.json({task:rows[0]})
}
