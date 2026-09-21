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
 const rows=await sql`select r.id,r.user_id,u.organization_id from password_resets r join users u on u.id=r.user_id where r.token=${token} and r.used_at is null and r.expires_at>now() limit 1`
 if(!rows[0])return NextResponse.json({error:'This reset link is invalid or expired.'},{status:410})
 const hash=hashPassword(password)
 const user=await sql`update users set password_hash=${hash} where id=${rows[0].user_id} returning id,email,name,role`
 await sql`update password_resets set used_at=now() where id=${rows[0].id}`
 await createSession(user[0].id,rows[0].organization_id)
 return NextResponse.json({user:user[0]})
}
