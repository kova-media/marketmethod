import { getDb } from './db'
import { ensureSchema } from './schema'

type EventPayload = Record<string, any>

export async function runAutomations(organizationId: string, eventType: string, contactId: string | null, payload: EventPayload = {}) {
  await ensureSchema()
  const sql = getDb()
  const automations = await sql`select id,name,conditions,actions from automations where organization_id=${organizationId} and enabled=true and trigger_type=${eventType}`

  for (const automation of automations) {
    const conditions = Array.isArray(automation.conditions) ? automation.conditions : []
    const matches = conditions.every((condition: any) => payload[condition.field] === condition.value)
    if (!matches) continue

    let status = 'completed'
    const details: any[] = []

    try {
      for (const action of (Array.isArray(automation.actions) ? automation.actions : [])) {
        if (action.type === 'create_task' && action.title) {
          await sql`insert into tasks(organization_id,contact_id,title,description,due_at) values(${organizationId},${contactId},${action.title},${action.description || null},${action.dueAt ? new Date(Date.now() + Number(action.dueAt) * 86400000).toISOString() : null})`
          details.push({ type: action.type, title: action.title })
        }

        if (action.type === 'add_activity' && action.title) {
          await sql`insert into activities(organization_id,contact_id,type,title,body) values(${organizationId},${contactId},'automation',${action.title},${action.body || null})`
          details.push({ type: action.type, title: action.title })
        }

        if (action.type === 'send_email' && action.to && action.subject && action.body) {
          const apiKey = process.env.RESEND_API_KEY
          if (!apiKey) throw new Error('RESEND_API_KEY is not configured')
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: 'Market Method <contact@marketmethod.co>', to: [action.to], subject: action.subject, text: action.body }),
          })
          if (!response.ok) throw new Error('Email action failed')
          details.push({ type: action.type, to: action.to })
        }
      }
    } catch (error) {
      status = 'failed'
      details.push({ error: error instanceof Error ? error.message : 'Automation action failed' })
    }

    await sql`insert into automation_events(organization_id,automation_id,contact_id,event_type,status,details) values(${organizationId},${automation.id},${contactId},${eventType},${status},${JSON.stringify({ payload, actions: details })})`
  }
}
