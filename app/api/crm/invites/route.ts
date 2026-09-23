import {NextRequest,NextResponse} from 'next/server'
import {createHash,randomBytes} from 'crypto'
import {getDb} from '../../../../lib/db'
import {getAuthenticatedSession} from '../../../../lib/authenticated'
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
 const s=await ownerSession()
 if(!s)return NextResponse.json({error:'Owner access required'},{status:403})
 const sql=getDb()
 const invites=await sql`select id,email,role,expires_at,accepted_at,created_at from user_invites where organization_id=${s.organizationId} order by created_at desc limit 50`
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
 const tokenHash=createHash('sha256').update(token).digest('hex')
 const rows=await sql`insert into user_invites(organization_id,email,role,token,token_hash,expires_at,created_by) values(${s.organizationId},${email},${role},${tokenHash},${tokenHash},now()+interval '7 days',${s.userId}) returning id,email,role,expires_at`
 const inviteUrl='/crm/invite/'+token
 const appUrl=process.env.CRM_APP_URL||'https://marketmethod.co'
 const apiKey=process.env.RESEND_API_KEY
 let emailSent=false
 if(apiKey){
  const organization=(await sql`select name,sender_name,sender_email,reply_to_email from organizations where id=${s.organizationId} limit 1`)[0]
  const fromEmail=organization?.sender_email||'contact@marketmethod.co'
  const response=await fetch('https://api.resend.com/emails',{
   method:'POST',
   headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
   body:JSON.stringify({
    from:(organization?.sender_name||organization?.name||'Market Method')+' <'+fromEmail+'>',
    to:[email],
    reply_to:organization?.reply_to_email||fromEmail,
    subject:'You have been invited to Market Method',
    text:['You have been invited to join '+(organization?.name||'a Market Method workspace')+'.','','Accept your invitation:',appUrl+inviteUrl,'','This invitation expires in 7 days.'].join('\n')
   })
  })
  emailSent=response.ok
 }
 return NextResponse.json({invite:rows[0],inviteUrl,emailSent},{status:201})
}
