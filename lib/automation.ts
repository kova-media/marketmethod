import { getDb } from './db'
import { ensureSchema } from './schema'

type EventPayload = Record<string, any>

export async function runAutomations(organizationId: string, eventType: string, contactId: string | null, payload: EventPayload = {}) {
  await ensureSchema()
  const sql = getDb()
  const automations = await sql`select id,name,conditions,actions from automations where organization_id=${organizationId} and enabled=true and trigger_type=${eventType} order by created_at asc`

  const contact = contactId ? (await sql`select id,first_name,last_name,email,phone from contacts where id=${contactId} and organization_id=${organizationId} limit 1`)[0] : null
  const organization = (await sql`select id,name,sender_name,sender_email,reply_to_email,sms_from_number from organizations where id=${organizationId} limit 1`)[0]

  const resolve = (value:any) => String(value || '')
    .replaceAll('{{contact.first_name}}', contact?.first_name || '')
    .replaceAll('{{contact.last_name}}', contact?.last_name || '')
    .replaceAll('{{contact.email}}', contact?.email || '')
    .replaceAll('{{contact.phone}}', contact?.phone || '')
    .replaceAll('{{organization.name}}', organization?.name || '')

  for (const automation of automations) {
    const conditions = Array.isArray(automation.conditions) ? automation.conditions : []
    const matches = conditions.every((condition: any) => String(payload[condition.field] ?? '') === String(condition.value ?? ''))
    if (!matches) continue

    let status = 'completed'
    const details: any[] = []

    try {
      for (const action of (Array.isArray(automation.actions) ? automation.actions : [])) {
        if (action.type === 'create_task' && action.title) {
          await sql`insert into tasks(organization_id,contact_id,title,description,due_at) values(${organizationId},${contactId},${resolve(action.title)},${action.description ? resolve(action.description) : null},${action.dueAt ? new Date(Date.now() + Number(action.dueDays ?? action.dueAt ?? 0) * 86400000).toISOString() : null})`
          details.push({ type: action.type, title: action.title })
        }

        if (action.type === 'add_activity' && action.title) {
          await sql`insert into activities(organization_id,contact_id,type,title,body) values(${organizationId},${contactId},'automation',${resolve(action.title)},${action.body ? resolve(action.body) : null})`
          details.push({ type: action.type, title: action.title })
        }

        if (action.type === 'send_email' && action.subject && action.body) {
          const apiKey = process.env.RESEND_API_KEY
          if (!apiKey) throw new Error('RESEND_API_KEY is not configured')
          const to = resolve(action.to || '{{contact.email}}')
          const fromEmail = organization?.sender_email
          if (!to) throw new Error('No email recipient is available')
          if (!fromEmail) throw new Error('Workspace sender email is not configured')
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: (organization?.sender_name || organization?.name || 'Market Method') + ' <' + fromEmail + '>',
              to: [to],
              reply_to: organization?.reply_to_email || fromEmail,
              subject: resolve(action.subject),
              text: resolve(action.body)
            }),
          })
          if (!response.ok) throw new Error('Email action failed: ' + await response.text())
          details.push({ type: action.type, to })
        }

        if (action.type === 'send_sms' && action.body) {
          const sid = process.env.TWILIO_ACCOUNT_SID
          const token = process.env.TWILIO_AUTH_TOKEN
          const from = organization?.sms_from_number
          const to = resolve(action.to || '{{contact.phone}}')
          if (!sid || !token) throw new Error('Twilio credentials are not configured')
          if (!from) throw new Error('Workspace SMS number is not configured')
          if (!to) throw new Error('No SMS recipient is available')
          const auth = Buffer.from(sid + ':' + token).toString('base64')
          const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
            method: 'POST',
            headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({To: to, From: from, Body: resolve(action.body)}).toString()
          })
          if (!response.ok) throw new Error('SMS action failed: ' + await response.text())
          details.push({ type: action.type, to })
        }
      }
    } catch (error) {
      status = 'failed'
      details.push({ error: error instanceof Error ? error.message : 'Automation action failed' })
    }

    await sql`insert into automation_events(organization_id,automation_id,contact_id,event_type,status,details) values(${organizationId},${automation.id},${contactId},${eventType},${status},${JSON.stringify({ payload, actions: details })})`
  }
}
