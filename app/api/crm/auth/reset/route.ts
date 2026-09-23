import {NextRequest,NextResponse} from 'next/server'
import {getDb} from '../../../../../lib/db'
import {hashPassword,createSession} from '../../../../../lib/auth'
import {ensureSchema} from '../../../../../lib/schema'

export async function POST(req:NextRequest){
 await ensureSchema()
 const b=await req.json()
 const token=String(b.token||'')
 const password=String(b.password||'')
 if(!token||password.length<8)return NextResponse.json({error:'A valid token and password of at least 8 characters are required.'},{status:400})
 const sql=getDb()
 const claimed=await sql`update password_resets set used_at=now() where token=${token} and used_at is null and expires_at>now() returning id,user_id`
 if(!claimed[0])return NextResponse.json({error:'This reset link is invalid or expired.'},{status:410})
 const user=await sql`update users set password_hash=${hashPassword(password)} where id=${claimed[0].user_id} returning id,email,name,role,organization_id`
 if(!user[0])return NextResponse.json({error:'Account not found.'},{status:404})
 await createSession(user[0].id,user[0].organization_id)
 return NextResponse.json({user:{id:user[0].id,email:user[0].email,name:user[0].name,role:user[0].role}})
}
