import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { ensureSchema } from '../../../../lib/schema'
import { runAutomationJob } from '../../../../lib/automation'

export const dynamic='force-dynamic'

export async function GET(req:NextRequest){
 const secret=process.env.CRON_SECRET
 const authorization=req.headers.get('authorization')
 if(!secret||authorization!=='Bearer '+secret)return NextResponse.json({error:'Unauthorized'},{status:401})
 await ensureSchema()
 const sql=getDb()
 await sql`update automation_jobs set status='pending',last_error='Recovered stale running job',run_at=now() where status='running' and started_at<now()-interval '15 minutes'`
 const jobs=await sql`select id from automation_jobs where status='pending' and run_at<=now() order by run_at asc limit 25`
 const results=[]
 for(const job of jobs)results.push({id:job.id,...(await runAutomationJob(job.id))})
 return NextResponse.json({processed:results.length,results})
}
