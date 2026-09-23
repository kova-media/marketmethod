import {NextRequest,NextResponse} from 'next/server'
import {getDb} from '../../../../lib/db'
import {getAuthenticatedSession} from '../../../../lib/authauthenticated'
import {ensureSchema} from '../../../../lib/schema'
export async function GET(){await ensureSchema();const s=await getAuthenticatedSession();if(!s)return NextResponse.json({error:'Unauthorized'},{status:401});const sql=getDb();const [automations,events]=await Promise.all([sql`select id,name,trigger_type,conditions,actions,enabled,created_at from automations where organization_id=${s.organizationId} order by created_at desc`,sql`select e.id,e.event_type,e.status,e.created_at,a.name as automation_name from automation_events e join automations a on a.id=e.automation_id where e.organization_id=${s.organizationId} order by e.created_at desc limit 50`]);return NextResponse.json({automations,events})}
export async function POST(req:NextRequest){await ensureSchema();const s=await getAuthenticatedSession();if(!s)return NextResponse.json({error:'Unauthorized'},{status:401});const b=await req.json();if(!b.name||!b.triggerType)return NextResponse.json({error:'Name and trigger are required'},{status:400});
const allowed=['contact_created','status_changed','appointment_created','appointment_completed','service_record_created'];
if(!allowed.includes(String(b.triggerType)))return NextResponse.json({error:'Invalid automation trigger'},{status:400});
if(String(b.name).trim().length>200)return NextResponse.json({error:'Automation name is too long'},{status:400});
if(!Array.isArray(b.conditions)||!Array.isArray(b.actions)||b.conditions.length>20||b.actions.length>20)return NextResponse.json({error:'Automation conditions or actions are invalid'},{status:400});
const allowedConditionFields=['status','previousStatus','type','source','serviceType','mileage','nextRecommendedDate'];
for(const condition of b.conditions){
 if(!condition||typeof condition!=='object'||!allowedConditionFields.includes(String(condition.field)))return NextResponse.json({error:'Invalid automation condition'},{status:400});
 if(String(condition.value??'').length>200)return NextResponse.json({error:'Automation condition value is too long'},{status:400});
}
const allowedActions=['create_task','add_activity','send_email','send_sms','wait'];
for(const action of b.actions){
 if(!action||typeof action!=='object'||!allowedActions.includes(String(action.type)))return NextResponse.json({error:'Invalid automation action'},{status:400});
 if(action.type==='wait'){
  const delay=Number(action.minutes||0)+Number(action.hours||0)*60+Number(action.days||0)*1440;
  if(!Number.isFinite(delay)||delay<=0||delay>525600)return NextResponse.json({error:'Automation wait must be between 1 minute and 365 days'},{status:400});
 }
 if(action.type==='create_task'&&(!String(action.title||'').trim()||String(action.title).length>500))return NextResponse.json({error:'Task action requires a valid title'},{status:400});
 if(action.type==='add_activity'&&(!String(action.title||'').trim()||String(action.title).length>500))return NextResponse.json({error:'Activity action requires a valid title'},{status:400});
 if(action.type==='send_email'&&(!String(action.subject||'').trim()||String(action.subject).length>500||!String(action.body||'').trim()||String(action.body).length>20000))return NextResponse.json({error:'Email action requires a valid subject and message'},{status:400});
 if(action.type==='send_sms'&&(!String(action.body||'').trim()||String(action.body).length>1600))return NextResponse.json({error:'SMS action requires a valid message'},{status:400});
 if(['send_email','send_sms'].includes(String(action.type))&&String(action.to||'{{contact.email}}').length>500)return NextResponse.json({error:'Automation recipient is too long'},{status:400});
}
const sql=getDb();const user=await sql`select role from users where id=${s.userId} and organization_id=${s.organizationId} limit 1`;if(user[0]?.role!=='owner')return NextResponse.json({error:'Owner access required'},{status:403});const rows=await sql`insert into automations(organization_id,name,trigger_type,conditions,actions,enabled) values(${s.organizationId},${b.name},${b.triggerType},${JSON.stringify(b.conditions||[])},${JSON.stringify(b.actions||[])},true) returning *`;return NextResponse.json({automation:rows[0]},{status:201})}
export async function PATCH(req:NextRequest){await ensureSchema();const s=await getAuthenticatedSession();if(!s)return NextResponse.json({error:'Unauthorized'},{status:401});const b=await req.json();const sql=getDb();const user=await sql`select role from users where id=${s.userId} and organization_id=${s.organizationId} limit 1`;if(user[0]?.role!=='owner')return NextResponse.json({error:'Owner access required'},{status:403});const rows=await sql`update automations set enabled=${!!b.enabled} where id=${b.id} and organization_id=${s.organizationId} returning *`;if(!rows[0])return NextResponse.json({error:'Automation not found'},{status:404});return NextResponse.json({automation:rows[0]})}
