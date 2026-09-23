import {NextRequest,NextResponse} from 'next/server'
import {getDb} from '../../../../lib/db'
import {getAuthenticatedSession} from '../../../../lib/authenticated'
import {ensureSchema} from '../../../../lib/schema'

export async function GET(req:NextRequest){
 await ensureSchema()
 const s=await getAuthenticatedSession()
 if(!s)return NextResponse.json({error:'Unauthorized'},{status:401})
 const contactId=new URL(req.url).searchParams.get('contactId')
 const sql=getDb()
 if(contactId){
  const contact=await sql`select id from contacts where id=${contactId} and organization_id=${s.organizationId} limit 1`
  if(!contact[0])return NextResponse.json({error:'Contact not found'},{status:404})
 }
 const rows=contactId
  ? await sql`select p.*,c.first_name,c.last_name from properties p join contacts c on c.id=p.contact_id and c.organization_id=p.organization_id where p.organization_id=${s.organizationId} and p.contact_id=${contactId} order by p.created_at desc`
  : await sql`select p.*,c.first_name,c.last_name from properties p join contacts c on c.id=p.contact_id and c.organization_id=p.organization_id where p.organization_id=${s.organizationId} order by p.created_at desc limit 500`
 return NextResponse.json({properties:rows})
}

export async function POST(req:NextRequest){
 await ensureSchema()
 const s=await getAuthenticatedSession()
 if(!s)return NextResponse.json({error:'Unauthorized'},{status:401})
 const b=await req.json()
 const address=String(b.address||'').trim()
 if(!b.contactId||!address)return NextResponse.json({error:'Customer and address are required'},{status:400})
 if(address.length>500)return NextResponse.json({error:'Address is too long'},{status:400})
 for(const [key,max] of [['name',200],['city',100],['state',100],['postalCode',30],['notes',5000]] as const){
  if(b[key]!==undefined&&b[key]!==null&&String(b[key]).length>max)return NextResponse.json({error:key+' is too long'},{status:400})
 }
 const sql=getDb()
 const c=await sql`select id from contacts where id=${b.contactId} and organization_id=${s.organizationId} limit 1`
 if(!c[0])return NextResponse.json({error:'Customer not found'},{status:404})
 const rows=await sql`insert into properties(organization_id,contact_id,name,address,city,state,postal_code,notes) values(${s.organizationId},${b.contactId},${b.name?.trim()||null},${address},${b.city?.trim()||null},${b.state?.trim()||null},${b.postalCode?.trim()||null},${b.notes?.trim()||null}) returning *`
 return NextResponse.json({property:rows[0]},{status:201})
}
