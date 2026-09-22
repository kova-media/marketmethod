import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'
import { ensureSchema } from '../../../../lib/schema'
import { runAutomationJob } from '../../../../lib/automation'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authorization = req.headers.get('authorization')
  if (!secret || authorization !== 'Bearer ' + secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema()
  const sql = getDb()
  const jobs = await sql`select id from automation_jobs where status='pending' and run_at<=now() order by run_at asc limit 25`

  const results = []
  for (const job of jobs) {
    results.push({ id: job.id, ...(await runAutomationJob(job.id)) })
  }

  return NextResponse.json({ processed: results.length, results })
}
