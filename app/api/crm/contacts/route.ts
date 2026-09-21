import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getSession } from '../../../../lib/auth'
import { ensureSchema } from '../../../../lib/schema'

export async function GET(){
 await ensureSchema()
 const session=getSession()
 if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
 const sql=getDb()
 const rows=await sql`select id,first_name,last_name,email,phone,company,type,source,status,notes,created_at,updated_at from contacts where organization_id=${session.organizationId} order by created_at desc limit 500`
 return NextResponse.json({contacts:rows})
}

export async function POST(request:NextRequest){
 await ensureSchema()
 const session=getSession()
 if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
 const body=await request.json()
 if(!body.firstName?.trim()) return NextResponse.json({error:'First name is required'},{status:400})
 const sql=getDb()
 const rows=await sql`insert into contacts(organization_id,first_name,last_name,email,phone,company,source,status,notes) values(${session.organizationId},${body.firstName.trim()},${body.lastName?.trim()||null},${body.email?.trim()||null},${body.phone?.trim()||null},${body.company?.trim()||null},${body.source||'Manual'},${body.status||'new'},${body.notes?.trim()||null}) returning id,first_name,last_name,email,phone,company,type,source,status,notes,created_at,updated_at`
 await sql`insert into activities(organization_id,contact_id,user_id,type,title,body) values(${session.organizationId},${rows[0].id},${session.userId},'contact_created','Customer created','Contact added manually.')`
 return NextResponse.json({contact:rows[0]},{status:201})
}

export async function PATCH(request:NextRequest){
 await ensureSchema()
 const session=getSession()
 if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
 const body=await request.json()
 if(!body.id) return NextResponse.json({error:'Contact id is required'},{status:400})
 const sql=getDb()
 const rows=await sql`update contacts set first_name=${body.firstName?.trim()||null},last_name=${body.lastName?.trim()||null},email=${body.email?.trim()||null},phone=${body.phone?.trim()||null},company=${body.company?.trim()||null},status=${body.status||'new'},notes=${body.notes?.trim()||null},updated_at=now() where id=${body.id} and organization_id=${session.organizationId} returning id,first_name,last_name,email,phone,company,type,source,status,notes,created_at,updated_at`
 if(!rows[0]) return NextResponse.json({error:'Contact not found'},{status:404})
 await sql`insert into activities(organization_id,contact_id,user_id,type,title,body) values(${session.organizationId},${body.id},${session.userId},'contact_updated','Customer updated','Contact details updated.')`
 return NextResponse.json({contact:rows[0]})
}
