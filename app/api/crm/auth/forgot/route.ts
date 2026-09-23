import {NextRequest,NextResponse} from 'next/server'
import {randomBytes} from 'crypto'
import {getDb} from '../../../../../lib/db'
import {ensureSchema} from '../../../../../lib/schema'

export async function POST(req:NextRequest){
 await ensureSchema()
 const b=await req.json()
 const email=String(b.email||'').trim().toLowerCase()
 if(!email||email.length>320)return NextResponse.json({success:true})
 const sql=getDb()
 const users=await sql`select u.id,u.email,o.name as organization_name from users u join organizations o on o.id=u.organization_id where lower(u.email)=${email} limit 1`
 if(users[0]){
  const token=randomBytes(32).toString('hex')
  await sql`update password_resets set used_at=now() where user_id=${users[0].id} and used_at is null`
  await sql`insert into password_resets(user_id,token,expires_at) values(${users[0].id},${token},now()+interval '1 hour')`
  const apiKey=process.env.RESEND_API_KEY
  const appUrl=process.env.CRM_APP_URL||'https://marketmethod.co'
  if(apiKey){
   await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({
    from:'Market Method <contact@marketmethod.co>',to:[email],subject:'Reset your Market Method password',
    text:['A password reset was requested for your Market Method account.', '', 'Reset your password:', appUrl+'/crm/reset-password/'+token, '', 'This link expires in 1 hour. If you did not request this, you can ignore this email.'].join('\n')
   })})
  }
 }
 return NextResponse.json({success:true})
}
