import { NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { getSession } from '../../../../lib/auth'

export async function GET() {
  const session=await getSession()
  if(!session) return NextResponse.json({error:'Unauthorized'},{status:401})
  const sql=getDb()
  const rows=await sql`select id,name,position,color from pipeline_stages where organization_id=${session.organizationId} order by position`
  return NextResponse.json({stages:rows})
}
