import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../../lib/db'
import { verifyPassword, createSession } from '../../../../../lib/auth'
import { ensureSchema } from '../../../../../lib/schema'

export async function POST(request:NextRequest){
 await ensureSchema()
 const body=await request.json()
 const email=body.email?.trim().toLowerCase()
 const password=body.password||''
 if(!email||!password||email.length>320||password.length>200) return NextResponse.json({error:'Invalid email or password'},{status:400})
 const sql=getDb()
 const rows=await sql`select id,organization_id,email,name,role,password_hash from users where lower(email)=${email} order by created_at desc limit 1`
 if(!rows[0]||!rows[0].password_hash||!verifyPassword(password,rows[0].password_hash)) return NextResponse.json({error:'Invalid email or password'},{status:401})
 await createSession(rows[0].id,rows[0].organization_id)
 return NextResponse.json({user:{id:rows[0].id,email:rows[0].email,name:rows[0].name,role:rows[0].role}})
}
