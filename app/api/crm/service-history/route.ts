import {NextRequest,NextResponse} from 'next/server'
import {getDb} from '../../../../lib/db'
import {getAuthenticatedSession} from '../../../../lib/authenticated'
import {ensureSchema} from '../../../../lib/schema'
import {runAutomations} from '../../../../lib/automation'

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
  ? await sql`select sh.*,p.name,p.address from service_history sh left join properties p on p.id=sh.property_id and p.organization_id=sh.organization_id and p.contact_id=sh.contact_id where sh.organization_id=${s.organizationId} and sh.contact_id=${contactId} order by sh.service_date desc`
  : await sql`select sh.*,p.name,p.address,c.first_name,c.last_name from service_history sh left join properties p on p.id=sh.property_id and p.organization_id=sh.organization_id and p.contact_id=sh.contact_id join contacts c on c.id=sh.contact_id and c.organization_id=sh.organization_id where sh.organization_id=${s.organizationId} order by sh.service_date desc limit 500`
 return NextResponse.json({history:rows})
}

export async function POST(req:NextRequest){
 await ensureSchema()
 const s=await getAuthenticatedSession()
 if(!s)return NextResponse.json({error:'Unauthorized'},{status:401})
 const b=await req.json()
 if(!b.contactId||!b.serviceType)return NextResponse.json({error:'Customer and service type are required'},{status:400})
 const sql=getDb()
 const contact=await sql`select id from contacts where id=${b.contactId} and organization_id=${s.organizationId} limit 1`
 if(!contact[0])return NextResponse.json({error:'Customer not found'},{status:404})

 if(b.propertyId){
  const property=await sql`select id from properties where id=${b.propertyId} and contact_id=${b.contactId} and organization_id=${s.organizationId} limit 1`
  if(!property[0])return NextResponse.json({error:'Property not found for this customer'},{status:404})
 }

 const serviceDate=b.serviceDate||new Date().toISOString().slice(0,10)
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(serviceDate))||Number.isNaN(new Date(String(serviceDate)+'T00:00:00Z').getTime()))return NextResponse.json({error:'Invalid service date'},{status:400})
 if(String(b.serviceType).length>200)return NextResponse.json({error:'Service type is too long'},{status:400})
 if(b.amount!==undefined&&b.amount!==null&&(!Number.isFinite(Number(b.amount))||Number(b.amount)<0||Number(b.amount)>100000000))return NextResponse.json({error:'Invalid amount'},{status:400})
 if(b.notes&&String(b.notes).length>10000)return NextResponse.json({error:'Service notes are too long'},{status:400})
 const rows=await sql`insert into service_history(organization_id,contact_id,property_id,service_date,service_type,amount,notes,next_recommended_date) values(${s.organizationId},${b.contactId},${b.propertyId||null},${serviceDate},${b.serviceType},${b.amount||null},${b.notes||null},${b.nextRecommendedDate||null}) returning *`
 await sql`insert into activities(organization_id,contact_id,user_id,type,title,body) values(${s.organizationId},${b.contactId},${s.userId},'service_recorded','Service recorded',${b.serviceType})`
 await runAutomations(s.organizationId,'service_record_created',b.contactId,{serviceType:rows[0].service_type,nextRecommendedDate:rows[0].next_recommended_date})
 return NextResponse.json({record:rows[0]},{status:201})
}
