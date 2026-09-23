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
 const rows=contactId
  ? await sql`select sr.*,v.year,v.make,v.model from service_records sr left join vehicles v on v.id=sr.vehicle_id where sr.organization_id=${s.organizationId} and sr.contact_id=${contactId} order by sr.service_date desc`
  : await sql`select sr.*,v.year,v.make,v.model from service_records sr left join vehicles v on v.id=sr.vehicle_id where sr.organization_id=${s.organizationId} order by sr.service_date desc limit 500`
 return NextResponse.json({records:rows})
}

export async function POST(req:NextRequest){
 await ensureSchema()
 const s=getSession()
 if(!s)return NextResponse.json({error:'Unauthorized'},{status:401})
 const b=await req.json()
 if(!b.contactId||!b.serviceType)return NextResponse.json({error:'Customer and service type are required'},{status:400})
 const sql=getDb()

 const contact=await sql`select id from contacts where id=${b.contactId} and organization_id=${s.organizationId} limit 1`
 if(!contact[0])return NextResponse.json({error:'Customer not found'},{status:404})

 if(b.vehicleId){
  const vehicle=await sql`select id from vehicles where id=${b.vehicleId} and contact_id=${b.contactId} and organization_id=${s.organizationId} limit 1`
  if(!vehicle[0])return NextResponse.json({error:'Vehicle not found for this customer'},{status:404})
 }

 const serviceDate=b.serviceDate||new Date().toISOString().slice(0,10)
 const rows=await sql`
  insert into service_records(organization_id,contact_id,vehicle_id,service_date,service_type,mileage,amount,notes,next_recommended_date,next_recommended_mileage)
  values(${s.organizationId},${b.contactId},${b.vehicleId||null},${serviceDate},${b.serviceType},${b.mileage||null},${b.amount||null},${b.notes||null},${b.nextRecommendedDate||null},${b.nextRecommendedMileage||null})
  returning *
 `

 await sql`
  insert into activities(organization_id,contact_id,user_id,type,title,body)
  values(${s.organizationId},${b.contactId},${s.userId},'service_recorded','Service recorded',${b.serviceType})
 `

 if(b.nextRecommendedDate){
  const existing=await sql`
   select id
   from tasks
   where organization_id=${s.organizationId}
     and contact_id=${b.contactId}
     and completed_at is null
     and title=${'Recommended service: '+b.serviceType}
     and due_at::date=${b.nextRecommendedDate}::date
   limit 1
  `
  if(!existing[0]){
   await sql`
    insert into tasks(organization_id,contact_id,title,description,due_at)
    values(
      ${s.organizationId},
      ${b.contactId},
      ${'Recommended service: '+b.serviceType},
      ${'Follow up on the recommended service recorded on '+serviceDate+'.'},
      ${b.nextRecommendedDate}
    )
   `
  }
 }

 return NextResponse.json({record:rows[0]},{status:201})
}
