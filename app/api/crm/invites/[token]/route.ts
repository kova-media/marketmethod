import {NextRequest,NextResponse} from 'next/server'
import {createHash} from 'crypto'
import {getDb} from '../../../../../lib/db'
import {hashPassword,createSession} from '../../../../../lib/auth'
import {ensureSchema} from '../../../../../lib/schema'

export async function GET(_req:NextRequest,{params}:{params:{token:string}}){
 await ensureSchema()
 const sql=getDb()
 const token=String(params.token||'')
 if(!token||token.length>200)return NextResponse.json({error:'Invite not found'},{status:404})
 const tokenHash=createHash('sha256').update(token).digest('hex')
 const rows=await sql`select i.email,i.role,i.expires_at,i.accepted_at,o.name as organization_name from user_invites i join organizations o on o.id=i.organization_id where (i.token_hash=${tokenHash} or i.token=${token}) limit 1`
 if(!rows[0])return NextResponse.json({error:'Invite not found'},{status:404})
 if(rows[0].accepted_at||new Date(rows[0].expires_at).getTime()<Date.now())return NextResponse.json({error:'This invite is no longer valid.'},{status:410})
 return NextResponse.json({invite:rows[0]})
}

export async function POST(req:NextRequest,{params}:{params:{token:string}}){
 await ensureSchema()
 const b=await req.json()
 const name=String(b.name||'').trim()
 const password=String(b.password||'')
 if(!name||name.length>200||password.length<8||password.length>200)return NextResponse.json({error:'Name and a password of at least 8 characters are required.'},{status:400})
 const sql=getDb()
 const token=String(params.token||'')
 if(!token||token.length>200)return NextResponse.json({error:'Invite not found'},{status:404})
 const tokenHash=createHash('sha256').update(token).digest('hex')
 const rows=await sql`select id,email,role,organization_id,expires_at,accepted_at from user_invites where (token_hash=${tokenHash} or token=${token}) limit 1`
 if(!rows[0])return NextResponse.json({error:'Invite not found'},{status:404})
 const invite=rows[0]
 if(invite.accepted_at||new Date(invite.expires_at).getTime()<Date.now())return NextResponse.json({error:'This invite is no longer valid.'},{status:410})
 const existing=await sql`select id from users where organization_id=${invite.organization_id} and lower(email)=lower(${invite.email}) limit 1`
 if(existing[0])return NextResponse.json({error:'An account with this email already exists.'},{status:409})
 const passwordHash=hashPassword(password)
 const rows=await sql`
   with claimed as (
     update user_invites
     set accepted_at=now()
     where id=${invite.id}
       and accepted_at is null
       and expires_at>now()
     returning organization_id,email,role
   )
   insert into users(organization_id,email,name,role,password_hash)
   select organization_id,lower(email),${name},role,${passwordHash}
   from claimed
   returning id,email,name,role,organization_id
 `
 if(!rows[0])return NextResponse.json({error:'This invite has already been accepted or expired.'},{status:410})
 const user=rows[0]
 await createSession(user.id,user.organization_id)
 return NextResponse.json({user:{id:user.id,email:user.email,name:user.name,role:user.role}},{status:201})
}
