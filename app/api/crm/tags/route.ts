import {NextRequest,NextResponse} from 'next/server'
import {getDb} from '../../../../lib/db'
import {getSession} from '../../../../lib/auth'
import {ensureSchema} from '../../../../lib/schema'

export async function GET(req:NextRequest){
 await ensureSchema()
 const s=getSession()
 if(!s)return NextResponse.json({error:'Unauthorized'},{status:401})
 const contactId=new URL(req.url).searchParams.get('contactId')
 const sql=getDb()
 const tags=await sql`select id,name from tags where organization_id=${s.organizationId} order by name`
 if(!contactId)return NextResponse.json({tags})
 const contact=await sql`select id from contacts where id=${contactId} and organization_id=${s.organizationId} limit 1`
 if(!contact[0])return NextResponse.json({error:'Contact not found'},{status:404})
 const assigned=await sql`select t.id,t.name from tags t join contact_tags ct on ct.tag_id=t.id where t.organization_id=${s.organizationId} and ct.contact_id=${contactId} order by t.name`
 return NextResponse.json({tags,assigned})
}

export async function POST(req:NextRequest){
 await ensureSchema()
 const s=getSession()
 if(!s)return NextResponse.json({error:'Unauthorized'},{status:401})
 const b=await req.json()
 const sql=getDb()
 if(b.name?.trim()){
  const rows=await sql`insert into tags(organization_id,name) values(${s.organizationId},${b.name.trim()}) on conflict(organization_id,name) do update set name=excluded.name returning id,name`
  return NextResponse.json({tag:rows[0]},{status:201})
 }
 if(b.contactId&&b.tagId){
  const valid=await sql`select id from tags where id=${b.tagId} and organization_id=${s.organizationId}`
  const contact=await sql`select id from contacts where id=${b.contactId} and organization_id=${s.organizationId}`
  if(!valid[0]||!contact[0])return NextResponse.json({error:'Tag or contact not found'},{status:404})
  await sql`insert into contact_tags(contact_id,tag_id) values(${b.contactId},${b.tagId}) on conflict do nothing`
  return NextResponse.json({success:true},{status:201})
 }
 return NextResponse.json({error:'Tag name or contact and tag are required'},{status:400})
}

export async function DELETE(req:NextRequest){
 await ensureSchema()
 const s=getSession()
 if(!s)return NextResponse.json({error:'Unauthorized'},{status:401})
 const b=await req.json()
 if(!b.contactId||!b.tagId)return NextResponse.json({error:'Contact and tag are required'},{status:400})
 const sql=getDb()
 const contact=await sql`select id from contacts where id=${b.contactId} and organization_id=${s.organizationId} limit 1`
 if(!contact[0])return NextResponse.json({error:'Contact not found'},{status:404})
 const tag=await sql`select id from tags where id=${b.tagId} and organization_id=${s.organizationId} limit 1`
 if(!tag[0])return NextResponse.json({error:'Tag not found'},{status:404})
 await sql`delete from contact_tags where contact_id=${b.contactId} and tag_id=${b.tagId}`
 return NextResponse.json({success:true})
}
