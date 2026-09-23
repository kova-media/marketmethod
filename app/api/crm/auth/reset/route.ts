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
   with claimed as (
     update password_resets
     set used_at=now()
     where (token_hash=${tokenHash} or token=${token})
       and used_at is null
       and expires_at>now()
     returning user_id
   )
   update users
   set password_hash=${passwordHash}
   from claimed
   where users.id=claimed.user_id
   returning users.id,users.email,users.name,users.role,users.organization_id
 `
 if(!rows[0])return NextResponse.json({error:'This reset link is invalid or expired.'},{status:410})
 const user=rows[0]
 await createSession(user.id,user.organization_id)
 return NextResponse.json({user:{id:user.id,email:user.email,name:user.name,role:user.role}})
}
