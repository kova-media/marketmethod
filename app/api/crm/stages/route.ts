import {NextRequest,NextResponse} from 'next/server'
import {getDb} from '../../../../lib/db'
import {getAuthenticatedSession} from '../../../../lib/authauthenticated'
import {ensureSchema} from '../../../../lib/schema'

async function owner(){
 const s=await getAuthenticatedSession()
 if(!s)return null
 const sql=getDb()
 const u=await sql`select role from users where id=${s.userId} and organization_id=${s.organizationId} limit 1`
 return u[0]?.role==='owner'?s:null
}

export async function POST(req:NextRequest){
 await ensureSchema()
 const s=await owner()
 if(!s)return NextResponse.json({error:'Owner access required'},{status:403})
 const b=await req.json()
 const name=String(b.name||'').trim()
 if(!name)return NextResponse.json({error:'Stage name is required'},{status:400})
 if(name.length>100)return NextResponse.json({error:'Stage name is too long'},{status:400})
 const sql=getDb()
 const max=await sql`select coalesce(max(position),0)+1 as position from pipeline_stages where organization_id=${s.organizationId}`
 const rows=await sql`insert into pipeline_stages(organization_id,name,position) values(${s.organizationId},${name},${max[0].position}) returning id,name,position,color`
 return NextResponse.json({stage:rows[0]},{status:201})
}

export async function PATCH(req:NextRequest){
 await ensureSchema()
 const s=await owner()
 if(!s)return NextResponse.json({error:'Owner access required'},{status:403})
 const b=await req.json()
 const name=String(b.name||'').trim()
 if(!name)return NextResponse.json({error:'Stage name is required'},{status:400})
 if(name.length>100)return NextResponse.json({error:'Stage name is too long'},{status:400})
 const position=Number(b.position)
 if(!Number.isInteger(position)||position<0||position>10000)return NextResponse.json({error:'Invalid stage position'},{status:400})
 if(b.color!==undefined&&b.color!==null&&b.color!==''&&!/^#[0-9A-Fa-f]{6}$/.test(String(b.color)))return NextResponse.json({error:'Invalid stage color'},{status:400})
 const sql=getDb()
 const rows=await sql`update pipeline_stages set name=${name},position=${position},color=${b.color||null} where id=${b.id} and organization_id=${s.organizationId} returning id,name,position,color`
 if(!rows[0])return NextResponse.json({error:'Stage not found'},{status:404})
 return NextResponse.json({stage:rows[0]})
}

export async function DELETE(req:NextRequest){
 await ensureSchema()
 const s=await owner()
 if(!s)return NextResponse.json({error:'Owner access required'},{status:403})
 const b=await req.json()
 const sql=getDb()
 const stage=await sql`select id,name from pipeline_stages where id=${b.id} and organization_id=${s.organizationId} limit 1`
 if(!stage[0])return NextResponse.json({error:'Stage not found'},{status:404})
 const used=await sql`select count(*)::int as count from contacts where organization_id=${s.organizationId} and status=lower(${stage[0].name})`
 if(used[0]?.count)return NextResponse.json({error:'Move the contacts out of this stage before deleting it.'},{status:409})
 await sql`delete from pipeline_stages where id=${b.id} and organization_id=${s.organizationId}`
 return NextResponse.json({success:true})
}
