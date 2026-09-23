import { getDb } from './db'
import { ensureSchema } from './schema'

type EventPayload = Record<string, any>

type AutomationContext = {
  organizationId: string
  automationId: string
  contactId: string | null
  eventType: string
  payload: EventPayload
  contact: any
  organization: any
}

function resolveValue(value: any, context: AutomationContext) {
  return String(value || '')
    .replaceAll('{{contact.first_name}}', context.contact?.first_name || '')
    .replaceAll('{{contact.last_name}}', context.contact?.last_name || '')
    .replaceAll('{{contact.email}}', context.contact?.email || '')
    .replaceAll('{{contact.phone}}', context.contact?.phone || '')
    .replaceAll('{{organization.name}}', context.organization?.name || '')
}

function waitUntil(action: any) {
  const minutes = Math.max(0, Number(action.minutes || 0))
  const hours = Math.max(0, Number(action.hours || 0))
  const days = Math.max(0, Number(action.days || 0))
  return new Date(Date.now() + ((days * 86400) + (hours * 3600) + (minutes * 60)) * 1000)
}

async function executeAction(sql: any, action: any, context: AutomationContext) {
  const { organizationId, contactId, contact, organization } = context

  if (action.type === 'create_task' && action.title) {
    const dueDays = action.dueDays !== undefined && action.dueDays !== null
      ? Number(action.dueDays)
      : (action.dueAt !== undefined && action.dueAt !== null ? Number(action.dueAt) : null)
    const dueAt = dueDays !== null
      ? new Date(Date.now() + Math.max(0, dueDays) * 86400000).toISOString()
      : null
    await sql`insert into tasks(organization_id,contact_id,title,description,due_at) values(${organizationId},${contactId},${resolveValue(action.title, context)},${action.description ? resolveValue(action.description, context) : null},${dueAt})`
    return { type: action.type, title: action.title }
  }

  if (action.type === 'add_activity' && action.title) {
    await sql`insert into activities(organization_id,contact_id,type,title,body) values(${organizationId},${contactId},'automation',${resolveValue(action.title, context)},${action.body ? resolveValue(action.body, context) : null})`
    return { type: action.type, title: action.title }
  }

  if (action.type === 'send_email' && action.subject && action.body) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY is not configured')
    const to = resolveValue(action.to || '{{contact.email}}', context)
    const fromEmail = organization?.sender_email || 'notifications@marketmethod.co'
    const inbound = contactId ? (await sql`select metadata from messages m join conversations c on c.id=m.conversation_id where m.organization_id=${organizationId} and c.contact_id=${contactId} and c.channel='email' and m.direction='inbound' and m.metadata->>'messageId' is not null order by m.sent_at desc limit 1`)[0] : null
    const replyHeaders = inbound?.metadata?.messageId ? { 'In-Reply-To': inbound.metadata.messageId, 'References': inbound.metadata.messageId } : undefined
    if (!to) throw new Error('No email recipient is available')
    if (!fromEmail) throw new Error('Workspace sender email is not configured')
    const subject = resolveValue(action.subject, context)
    const body = resolveValue(action.body, context)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: (organization?.sender_name || organization?.name || 'Market Method') + ' <' + fromEmail + '>',
        to: [to],
        reply_to: organization?.reply_to_email || fromEmail,
        subject,
        text: body,
        ...(replyHeaders ? { headers: replyHeaders } : {})
      }),
    })
    if (!response.ok) throw new Error('Email action failed: ' + await response.text())
    const emailResult = await response.json().catch(() => ({}))
    const providerMessageId = emailResult.id || null

    if (contactId) {
      let conversation = (await sql`
        select id
        from conversations
        where organization_id=${organizationId}
          and contact_id=${contactId}
          and channel='email'
          and status='open'
        order by updated_at desc
        limit 1
      `)[0]

      if (!conversation) {
        conversation = (await sql`
          insert into conversations(organization_id,contact_id,channel,status)
          values(${organizationId},${contactId},'email','open')
          returning id
        `)[0]
      }

      await sql`
        insert into messages(organization_id,conversation_id,direction,body,subject,external_id,metadata)
        values(${organizationId},${conversation.id},'outbound',${body},${subject},${providerMessageId},${JSON.stringify({provider:'email',source:'automation'})})
      `

      await sql`
        update conversations
        set updated_at=now(), unread_count=0
        where id=${conversation.id}
          and organization_id=${organizationId}
      `
    }

    return { type: action.type, to, providerMessageId }
  }

  if (action.type === 'send_sms' && action.body) {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = organization?.sms_from_number
    const to = resolveValue(action.to || '{{contact.phone}}', context)
    if (!sid || !token) throw new Error('Twilio credentials are not configured')
    if (!from) throw new Error('Workspace SMS number is not configured')
    if (!to) throw new Error('No SMS recipient is available')
    const body = resolveValue(action.body, context)
    const auth = Buffer.from(sid + ':' + token).toString('base64')
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString()
    })
    if (!response.ok) throw new Error('SMS action failed: ' + await response.text())
    const smsResult = await response.json().catch(() => ({}))
    const providerMessageId = smsResult.sid || null

    if (contactId) {
      let conversation = (await sql`
        select id
        from conversations
        where organization_id=${organizationId}
          and contact_id=${contactId}
          and channel='sms'
          and status='open'
        order by updated_at desc
        limit 1
      `)[0]

      if (!conversation) {
        conversation = (await sql`
          insert into conversations(organization_id,contact_id,channel,status)
          values(${organizationId},${contactId},'sms','open')
          returning id
        `)[0]
      }

      await sql`
        insert into messages(organization_id,conversation_id,direction,body,external_id,metadata)
        values(${organizationId},${conversation.id},'outbound',${body},${providerMessageId},${JSON.stringify({provider:'sms',source:'automation'})})
      `

      await sql`
        update conversations
        set updated_at=now(), unread_count=0
        where id=${conversation.id}
          and organization_id=${organizationId}
      `
    }

    return { type: action.type, to, providerMessageId }
  }

  return { type: action.type, skipped: true }
}

async function executeActions(sql: any, actions: any[], context: AutomationContext) {
  const details: any[] = []

  for (let index = 0; index < actions.length; index++) {
    const action = actions[index]

    if (action.type === 'wait') {
      const remaining = actions.slice(index + 1)
      if (remaining.length) {
        const runAt = waitUntil(action)
        await sql`insert into automation_jobs(organization_id,automation_id,contact_id,event_type,actions,payload,run_at) values(${context.organizationId},${context.automationId},${context.contactId},${context.eventType},${JSON.stringify(remaining)},${JSON.stringify(context.payload)},${runAt.toISOString()})`
        details.push({ type: 'wait', runAt: runAt.toISOString(), queuedActions: remaining.length })
      }
      break
    }

    details.push(await executeAction(sql, action, context))
  }

  return details
}

async function loadContext(sql: any, organizationId: string, automationId: string, contactId: string | null, eventType: string, payload: EventPayload): Promise<AutomationContext> {
  const contact = contactId
    ? (await sql`select id,first_name,last_name,email,phone from contacts where id=${contactId} and organization_id=${organizationId} limit 1`)[0]
    : null
  const organization = (await sql`select id,name,sender_name,sender_email,reply_to_email,sms_from_number from organizations where id=${organizationId} limit 1`)[0]
  return { organizationId, automationId, contactId, eventType, payload, contact, organization }
}

export async function runAutomations(organizationId: string, eventType: string, contactId: string | null, payload: EventPayload = {}) {
  await ensureSchema()
  const sql = getDb()
  const automations = await sql`select id,name,conditions,actions from automations where organization_id=${organizationId} and enabled=true and trigger_type=${eventType} order by created_at asc`

  for (const automation of automations) {
    const conditions = Array.isArray(automation.conditions) ? automation.conditions : []
    const matches = conditions.every((condition: any) => String(payload[condition.field] ?? '') === String(condition.value ?? ''))
    if (!matches) continue

    const context = await loadContext(sql, organizationId, automation.id, contactId, eventType, payload)
    let status = 'completed'
    let details: any[] = []

    try {
      details = await executeActions(sql, Array.isArray(automation.actions) ? automation.actions : [], context)
      if (details.some(item => item.type === 'wait' && item.queuedActions > 0)) status = 'queued'
    } catch (error) {
      status = 'failed'
      details.push({ error: error instanceof Error ? error.message : 'Automation action failed' })
    }

    await sql`insert into automation_events(organization_id,automation_id,contact_id,event_type,status,details) values(${organizationId},${automation.id},${contactId},${eventType},${status},${JSON.stringify({ payload, actions: details })})`
  }
}

export async function runAutomationJob(jobId: string) {
  await ensureSchema()
  const sql = getDb()

  const claimed = await sql`update automation_jobs set status='running', attempts=attempts+1 where id=${jobId} and status='pending' and run_at<=now() returning *`
  const job = claimed[0]
  if (!job) return { status: 'skipped' }

  const automation = job.automation_id
    ? (await sql`select id,enabled from automations where id=${job.automation_id} and organization_id=${job.organization_id} limit 1`)[0]
    : null

  if (job.automation_id && (!automation || !automation.enabled)) {
    await sql`update automation_jobs set status='cancelled',completed_at=now() where id=${job.id}`
    return { status: 'cancelled' }
  }

  const context = await loadContext(sql, job.organization_id, job.automation_id, job.contact_id, job.event_type, job.payload || {})
  let status = 'completed'
  let details: any[] = []

  try {
    details = await executeActions(sql, Array.isArray(job.actions) ? job.actions : [], context)
    if (details.some(item => item.type === 'wait' && item.queuedActions > 0)) status = 'queued'
    await sql`update automation_jobs set status=${status},completed_at=now(),last_error=null where id=${job.id}`
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Automation action failed'
    details.push({ error: message })
    if (Number(job.attempts || 0) < 3) {
      status = 'retrying'
      await sql`update automation_jobs set status='pending',run_at=now()+interval '5 minutes',completed_at=null,last_error=${message} where id=${job.id}`
    } else {
      status = 'failed'
      await sql`update automation_jobs set status='failed',completed_at=now(),last_error=${message} where id=${job.id}`
    }
  }

  await sql`insert into automation_events(organization_id,automation_id,contact_id,event_type,status,details) values(${job.organization_id},${job.automation_id},${job.contact_id},${job.event_type},${status},${JSON.stringify({ payload: job.payload || {}, actions: details, jobId: job.id, attempt: job.attempts })})`

  return { status }
}
