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
 const recent=await sql`select count(*)::int as count from login_attempts where lower(email)=${email} and successful=false and attempted_at>now()-interval '15 minutes'`
 if(Number(recent[0]?.count||0)>=10)return NextResponse.json({error:'Too many login attempts. Try again later.'},{status:429})
 const rows=await sql`select id,organization_id,email,name,role,password_hash from users where lower(email)=${email} order by created_at desc limit 1`
 const valid=!!rows[0]&&!!rows[0].password_hash&&verifyPassword(password,rows[0].password_hash)
 await sql`insert into login_attempts(email,successful) values(${email},${valid})`
 if(!valid) return NextResponse.json({error:'Invalid email or password'},{status:401})
 await sql`delete from login_attempts where lower(email)=${email} and successful=true`
 await createSession(rows[0].id,rows[0].organization_id)
 return NextResponse.json({user:{id:rows[0].id,email:rows[0].email,name:rows[0].name,role:rows[0].role}})
}
