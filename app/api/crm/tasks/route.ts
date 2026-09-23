import { NextRequest,NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getAuthenticatedSession } from '../../../../lib/authenticated'
import { ensureSchema } from '../../../../lib/schema'

export async function GET(){
 await ensureSchema()
 const s=getSession()
 if(!s)return NextResponse.json({error:'Unauthorized'},{status:401})
 const sql=getDb()
 const rows=await sql`select t.id,t.title,t.description,t.due_at,t.completed_at,t.contact_id,t.assigned_to,c.first_name,c.last_name,u.name as assigned_name from tasks t left join contacts c on c.id=t.contact_id and c.organization_id=t.organization_id left join users u on u.id=t.assigned_to and u.organization_id=t.organization_id where t.organization_id=${s.organizationId} order by t.completed_at nulls first,t.due_at nulls last limit 250`
 return NextResponse.json({tasks:rows})
}

export async function POST(req:NextRequest){
 await ensureSchema()
 const s=getSession()
 if(!s)return NextResponse.json({error:'Unauthorized'},{status:401})
 const b=await req.json()
 const title=String(b.title||'').trim()
 if(!title)return NextResponse.json({error:'Title is required'},{status:400})
 if(title.length>500)return NextResponse.json({error:'Task title is too long'},{status:400})
 if(b.description!==undefined&&b.description!==null&&String(b.description).length>10000)return NextResponse.json({error:'Task description is too long'},{status:400})
 if(b.dueAt&&Number.isNaN(new Date(b.dueAt).getTime()))return NextResponse.json({error:'Invalid due date'},{status:400})
 const sql=getDb()
 const assignedTo=b.assignedTo||s.userId
 const validUser=await sql`select id from users where id=${assignedTo} and organization_id=${s.organizationId} limit 1`
 if(!validUser[0])return NextResponse.json({error:'Assigned user not found'},{status:400})
 const validContact=b.contactId?await sql`select id from contacts where id=${b.contactId} and organization_id=${s.organizationId} limit 1`:null
 if(b.contactId&&!validContact?.[0])return NextResponse.json({error:'Contact not found'},{status:400})
 const rows=await sql`insert into tasks(organization_id,contact_id,assigned_to,title,description,due_at) values(${s.organizationId},${b.contactId||null},${assignedTo},${title},${b.description?.trim()||null},${b.dueAt||null}) returning *`
 return NextResponse.json({task:rows[0]},{status:201})
}

export async function PATCH(req:NextRequest){
 await ensureSchema()
 const s=getSession()
 if(!s)return NextResponse.json({error:'Unauthorized'},{status:401})
 const b=await req.json()
 if(!b.id)return NextResponse.json({error:'Task id is required'},{status:400})
 const sql=getDb()
 const rows=await sql`update tasks set completed_at=${b.completed?new Date().toISOString():null} where id=${b.id} and organization_id=${s.organizationId} returning *`
 if(!rows[0])return NextResponse.json({error:'Task not found'},{status:404})
 return NextResponse.json({task:rows[0]})
}
