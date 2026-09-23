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
 if(contactId){
  const contact=await sql`select id from contacts where id=${contactId} and organization_id=${s.organizationId} limit 1`
  if(!contact[0])return NextResponse.json({error:'Contact not found'},{status:404})
 }
 const rows=contactId
  ? await sql`select v.*,c.first_name,c.last_name from vehicles v join contacts c on c.id=v.contact_id and c.organization_id=v.organization_id where v.organization_id=${s.organizationId} and v.contact_id=${contactId} order by v.created_at desc`
  : await sql`select v.*,c.first_name,c.last_name from vehicles v join contacts c on c.id=v.contact_id and c.organization_id=v.organization_id where v.organization_id=${s.organizationId} order by v.created_at desc limit 500`
 return NextResponse.json({vehicles:rows})
}

export async function POST(req:NextRequest){
 await ensureSchema()
 const s=getSession()
 if(!s)return NextResponse.json({error:'Unauthorized'},{status:401})
 const b=await req.json()
 if(!b.contactId||!b.make||!b.model)return NextResponse.json({error:'Customer, make, and model are required'},{status:400})
 const sql=getDb()
 const c=await sql`select id from contacts where id=${b.contactId} and organization_id=${s.organizationId} limit 1`
 if(!c[0])return NextResponse.json({error:'Customer not found'},{status:404})
 const rows=await sql`insert into vehicles(organization_id,contact_id,year,make,model,vin,mileage,license_plate,notes) values(${s.organizationId},${b.contactId},${b.year||null},${b.make},${b.model},${b.vin||null},${b.mileage||null},${b.licensePlate||null},${b.notes||null}) returning *`
 return NextResponse.json({vehicle:rows[0]},{status:201})
}
