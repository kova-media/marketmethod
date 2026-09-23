import { NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'

export const dynamic='force-dynamic'

export async function GET(){
 try{
  const sql=getDb()
  const result=await sql`select 1 as ok`
  return NextResponse.json({ok:result[0]?.ok===1})
 }catch{
  return NextResponse.json({ok:false},{status:503})
 }
}
