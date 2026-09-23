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
  ? await sql`select v.*,c.first_name,c.last_name from vehicles v join contacts c on c.id=v.contact_id and c.organization_id=v.organization_id where v.organization_id=${s.organizationId} and v.contact_id=${contactId} order by v.created_at desc`
  : await sql`select v.*,c.first_name,c.last_name from vehicles v join contacts c on c.id=v.contact_id and c.organization_id=v.organization_id where v.organization_id=${s.organizationId} order by v.created_at desc limit 500`
 return NextResponse.json({vehicles:rows})
}

export async function POST(req:NextRequest){
 await ensureSchema()
 const s=await getAuthenticatedSession()
 if(!s)return NextResponse.json({error:'Unauthorized'},{status:401})
 const b=await req.json()
 const make=String(b.make||'').trim()
 const model=String(b.model||'').trim()
 if(!b.contactId||!make||!model)return NextResponse.json({error:'Customer, make, and model are required'},{status:400})
 if(make.length>100||model.length>100)return NextResponse.json({error:'Vehicle make or model is too long'},{status:400})
 if(b.vin&&String(b.vin).length>50)return NextResponse.json({error:'VIN is too long'},{status:400})
 if(b.licensePlate&&String(b.licensePlate).length>30)return NextResponse.json({error:'License plate is too long'},{status:400})
 if(b.notes&&String(b.notes).length>5000)return NextResponse.json({error:'Vehicle notes are too long'},{status:400})
 if(b.year!==undefined&&b.year!==null&&(!Number.isInteger(Number(b.year))||Number(b.year)<1886||Number(b.year)>2200))return NextResponse.json({error:'Invalid vehicle year'},{status:400})
 if(b.mileage!==undefined&&b.mileage!==null&&(!Number.isInteger(Number(b.mileage))||Number(b.mileage)<0||Number(b.mileage)>2000000))return NextResponse.json({error:'Invalid vehicle mileage'},{status:400})
 const sql=getDb()
 const c=await sql`select id from contacts where id=${b.contactId} and organization_id=${s.organizationId} limit 1`
 if(!c[0])return NextResponse.json({error:'Customer not found'},{status:404})
 const rows=await sql`insert into vehicles(organization_id,contact_id,year,make,model,vin,mileage,license_plate,notes) values(${s.organizationId},${b.contactId},${b.year||null},${make},${model},${b.vin?.trim()||null},${b.mileage||null},${b.licensePlate?.trim()||null},${b.notes?.trim()||null}) returning *`
 return NextResponse.json({vehicle:rows[0]},{status:201})
}
