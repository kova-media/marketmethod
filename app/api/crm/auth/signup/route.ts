import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../../lib/db'
import { hashPassword, createSession } from '../../../../../lib/auth'
import { ensureSchema } from '../../../../../lib/schema'

function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)}

export async function POST(request:NextRequest){
 await ensureSchema()
 const body=await request.json()
 const businessName=body.businessName?.trim()
 const name=body.name?.trim()
 const email=body.email?.trim().toLowerCase()
 const password=body.password||''
 if(!businessName||!name||!email||!password) return NextResponse.json({error:'Business name, name, email, and password are required'},{status:400})
 if(password.length<8) return NextResponse.json({error:'Password must be at least 8 characters'},{status:400})
 const sql=getDb()
 const base=slugify(businessName)||'workspace'
 const slug=base+'-'+Math.random().toString(36).slice(2,7)
 try{
  const orgRows=await sql`insert into organizations(name,slug,industry,primary_color) values(${businessName},${slug},${body.industry?.trim()||null},'#C7ED63') returning id`
  const orgId=orgRows[0].id
  const userRows=await sql`insert into users(organization_id,email,name,role,password_hash) values(${orgId},${email},${name},'owner',${hashPassword(password)}) returning id,email,name,role`
  for(const [stage,position] of [['New',1],['Contacted',2],['Qualified',3],['Won',4]] as const){
   await sql`insert into pipeline_stages(organization_id,name,position) values(${orgId},${stage},${position})`
  }
  await createSession(userRows[0].id,orgId)
  return NextResponse.json({user:userRows[0]},{status:201})
 }catch(error){
  const message=error instanceof Error?error.message:'Unable to create workspace'
  return NextResponse.json({error:message},{status:500})
 }
}
