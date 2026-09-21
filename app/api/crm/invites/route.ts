import {NextRequest,NextResponse} from 'next/server'
import {randomBytes} from 'crypto'
import {getDb} from '../../../../lib/db'
import {getSession} from '../../../../lib/auth'
import {ensureSchema} from '../../../../lib/schema'

async function ownerSession(){
 const s=getSession()
 if(!s)return null
 const sql=getDb()
 const rows=await sql`select id,role from users where id=${s.userId} and organization_id=${s.organizationId} limit 1`
 return rows[0]?.role==='owner'?s:null
}

export async function GET(){
 await ensureSchema()
 const s=getSession()
 if(!s)return NextResponse.json({error:'Unauthorized'},{status:401})
 const sql=getDb()
 const invites=await sql`select id,email,role,expires_at,accepted_at,created_at,token from user_invites where organization_id=${s.organizationId} order by created_at desc limit 50`
 return NextResponse.json({invites})
}

export async function POST(req:NextRequest){
 await ensureSchema()
 const s=await ownerSession()
 if(!s)return NextResponse.json({error:'Owner access required'},{status:403})
 const b=await req.json()
 const email=String(b.email||'').trim().toLowerCase()
 if(!email)return NextResponse.json({error:'Email is required'},{status:400})
 const role=b.role==='owner'?'owner':'member'
 const sql=getDb()
 const existing=await sql`select id from users where organization_id=${s.organizationId} and email=${email} limit 1`
 if(existing[0])return NextResponse.json({error:'That email is already a user in this workspace.'},{status:409})
 const token=randomBytes(24).toString('hex')
 const rows=await sql`insert into user_invites(organization_id,email,role,token,expires_at,created_by) values(${s.organizationId},${email},${role},${token},now()+interval '7 days',${s.userId}) returning id,email,role,expires_at,token`
 return NextResponse.json({invite:rows[0],inviteUrl:'/crm/invite/'+token},{status:201})
}
