import {NextRequest,NextResponse} from 'next/server'
import {createHash} from 'crypto'
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
 const tokenHash=createHash('sha256').update(token).digest('hex')
 const passwordHash=hashPassword(password)
 const rows=await sql`
   with candidate as (
     select pr.id,pr.user_id
     from password_resets pr
     join users u on u.id=pr.user_id
     where (pr.token_hash=${tokenHash} or pr.token=${token})
       and pr.used_at is null
       and pr.expires_at>now()
     order by pr.created_at desc
     limit 1
   ),
   updated as (
     update users
     set password_hash=${passwordHash}
     from candidate
     where users.id=candidate.user_id
     returning users.id,users.email,users.name,users.role,users.organization_id
   )
   update password_resets pr
   set used_at=now()
   from candidate,updated
   where pr.id=candidate.id
   returning updated.id,updated.email,updated.name,updated.role,updated.organization_id
 `
 if(!rows[0])return NextResponse.json({error:'This reset link is invalid or expired.'},{status:410})
 const user=rows[0]
 await createSession(user.id,user.organization_id)
 return NextResponse.json({user:{id:user.id,email:user.email,name:user.name,role:user.role}})
}
