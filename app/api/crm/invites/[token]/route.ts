import {NextRequest,NextResponse} from 'next/server'
import {getDb} from '../../../../../lib/db'
import {hashPassword,createSession} from '../../../../../lib/auth'
import {ensureSchema} from '../../../../../lib/schema'

export async function GET(_req:NextRequest,{params}:{params:{token:string}}){
 await ensureSchema()
 const sql=getDb()
 const rows=await sql`select i.email,i.role,i.expires_at,i.accepted_at,o.name as organization_name from user_invites i join organizations o on o.id=i.organization_id where i.token=${params.token} limit 1`
 if(!rows[0])return NextResponse.json({error:'Invite not found'},{status:404})
 if(rows[0].accepted_at||new Date(rows[0].expires_at).getTime()<Date.now())return NextResponse.json({error:'This invite is no longer valid.'},{status:410})
 return NextResponse.json({invite:rows[0]})
}

export async function POST(req:NextRequest,{params}:{params:{token:string}}){
 await ensureSchema()
 const b=await req.json()
 const name=String(b.name||'').trim()
 const password=String(b.password||'')
 if(!name||password.length<8)return NextResponse.json({error:'Name and a password of at least 8 characters are required.'},{status:400})
 const sql=getDb()
 const rows=await sql`select id,email,role,organization_id,expires_at,accepted_at from user_invites where token=${params.token} limit 1`
 if(!rows[0])return NextResponse.json({error:'Invite not found'},{status:404})
 const invite=rows[0]
 if(invite.accepted_at||new Date(invite.expires_at).getTime()<Date.now())return NextResponse.json({error:'This invite is no longer valid.'},{status:410})
 const existing=await sql`select id from users where organization_id=${invite.organization_id} and email=${invite.email} limit 1`
 if(existing[0])return NextResponse.json({error:'An account with this email already exists.'},{status:409})
 const user=await sql`insert into users(organization_id,email,name,role,password_hash) values(${invite.organization_id},${invite.email},${name},${invite.role},${hashPassword(password)}) returning id,email,name,role`
 await sql`update user_invites set accepted_at=now() where id=${invite.id}`
 await createSession(user[0].id,invite.organization_id)
 return NextResponse.json({user:user[0]},{status:201})
}
