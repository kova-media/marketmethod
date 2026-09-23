'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, MessageSquare, Plus, Send, X, Mail, Smartphone, ExternalLink } from 'lucide-react'

export default function ConversationsPage() {
  const [items, setItems] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [body, setBody] = useState('')
  const [subject, setSubject] = useState('')
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)
  const [contactId, setContactId] = useState('')
  const [channel, setChannel] = useState('sms')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('contact')
    if (!id || selected || !items.length) return
    const match = items.find(item => item.contact_id === id)
    if (match) open(match)
    else { setContactId(id); setShow(true) }
  }, [items, selected])

  async function load() {
    const [a, b] = await Promise.all([
      fetch('/api/crm/conversations'),
      fetch('/api/crm/contacts')
    ])
    const ad = await a.json()
    const bd = await b.json()

    if (a.ok) setItems(ad.conversations || [])
    if (b.ok) setContacts(bd.contacts || [])
  }

  async function open(c: any) {
    setSelected(c)
    setError('')

    const [r] = await Promise.all([
      fetch('/api/crm/conversations/' + c.id),
      fetch('/api/crm/conversations/' + c.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read' })
      })
    ])

    const d = await r.json()

    if (r.ok) {
      setMessages(d.messages || [])
      setItems(previous => previous.map(item =>
        item.id === c.id ? { ...item, unread_count: 0 } : item
      ))
      setSelected({ ...c, unread_count: 0 })
    }
  }

  async function create() {
    if (!contactId) { setCreateError('Choose a contact first.'); return }
    setCreateError('')

    const r = await fetch('/api/crm/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, channel })
    })

    const d = await r.json()

    if (r.ok) {
      setShow(false)
      setContactId('')
      await load()

      const contact = contacts.find(c => c.id === contactId)
      const found = {
        ...d.conversation,
        contact_id: contactId,
        first_name: contact?.first_name,
        last_name: contact?.last_name,
        email: contact?.email,
        phone: contact?.phone,
        channel,
        unread_count: 0
      }

      open(found)
    } else setCreateError(d.error || 'Conversation could not be created.')
  }

  async function send() {
    if (!body.trim() || !selected) return

    setError('')

    const r = await fetch('/api/crm/conversations/' + selected.id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, subject })
    })

    const d = await r.json()

    if (r.ok) {
      setMessages(previous => [...previous, d.message])
      setBody('')
      setSubject('')
      await load()
    } else {
      setError(d.error || 'Message could not be sent.')
    }
  }

  async function toggleStatus() {
    if (!selected) return

    const action = selected.status === 'closed' ? 'reopen' : 'close'
    const r = await fetch('/api/crm/conversations/' + selected.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })

    if (r.ok) {
      const status = action === 'close' ? 'closed' : 'open'
      setSelected({ ...selected, status })
      setItems(previous => previous.map(item =>
        item.id === selected.id ? { ...item, status } : item
      ))
    }
  }

  const unreadTotal = items.reduce((sum, item) => sum + Number(item.unread_count || 0), 0)
  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(c => {
      if (filter === 'unread' && Number(c.unread_count || 0) === 0) return false
      if (filter === 'open' && c.status !== 'open') return false
      if (filter === 'closed' && c.status !== 'closed') return false
      if (!q) return true
      const name = [c.first_name, c.last_name].filter(Boolean).join(' ').toLowerCase()
      return name.includes(q) || String(c.last_message || '').toLowerCase().includes(q)
    })
  }, [items, query, filter])

  return (
    <main className="module-page">
      <header className="module-top">
        <div>
          <a href="/crm/dashboard" className="back-link">
            <ChevronLeft size={15} /> Dashboard
          </a>
          <span className="eyebrow">CUSTOMER COMMUNICATION</span>
          <h1>Conversations</h1>
          <p>
            Keep customer messages in the same record as the relationship.
            {unreadTotal > 0 ? ' ' + unreadTotal + ' unread.' : ''}
          </p>
        </div>

        <button className="add-button" onClick={() => setShow(true)}>
          <Plus size={17} /> Start conversation
        </button>
      </header>

      <div className="conversation-layout">
        <aside className="conversation-list">
          <div className="conversation-filters">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search conversations" />
            <div className="filter-pills">
              {[
                ['all', 'All'],
                ['unread', 'Unread'],
                ['open', 'Open'],
                ['closed', 'Closed']
              ].map(([value, label]) => (
                <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {visibleItems.map(c => (
            <button
              key={c.id}
              className={selected?.id === c.id ? 'selected' : ''}
              onClick={() => open(c)}
            >
              <span className="contact-avatar">
                {[c.first_name, c.last_name]
                  .filter(Boolean)
                  .map((x: string) => x[0])
                  .join('')
                  .toUpperCase()}
              </span>

              <span>
                <strong>
                  {c.first_name} {c.last_name || ''}
                  {Number(c.unread_count || 0) > 0 && (
                    <b className="conversation-unread">{c.unread_count}</b>
                  )}
                </strong>
                <small>
                  {c.channel.toUpperCase()} · {c.status}
                </small>
                {c.last_message && (
                  <em className="conversation-preview">{c.last_message}</em>
                )}
              </span>
            </button>
          ))}

          {!visibleItems.length && (
            <div className="soft-empty">{items.length ? 'No conversations match these filters.' : 'No conversations yet.'}</div>
          )}
        </aside>

        <section className="conversation-main">
          {selected ? (
            <>
              <header className="conversation-header">
                <div>
                  <span className="eyebrow">{selected.channel.toUpperCase()}</span>
                  <h2>{selected.first_name} {selected.last_name || ''}</h2>
                  <div className="conversation-contact-links">
                    {selected.email && <a href={'mailto:' + selected.email}><Mail size={13} /> {selected.email}</a>}
                    {selected.phone && <a href={'tel:' + selected.phone}><Smartphone size={13} /> {selected.phone}</a>}
                    <a href={'/crm/contacts?contact=' + selected.contact_id}><ExternalLink size={13} /> Contact</a>
                  </div>
                </div>
                <button className="conversation-status-button" onClick={toggleStatus}>
                  {selected.status === 'closed' ? 'Reopen' : 'Close'}
                </button>
              </header>

              <div className="message-list">
                {messages.map(m => (
                  <div
                    className={'message-bubble ' + m.direction}
                    key={m.id}
                  >
                    {m.body}
                    <small>{new Date(m.sent_at).toLocaleString()}</small>
                  </div>
                ))}

                {!messages.length && (
                  <div className="soft-empty">
                    No messages yet.
                  </div>
                )}
              </div>

              {selected.status !== 'closed' && (
                <div className="message-compose">
                  {selected.channel === 'email' && (
                    <input
                      className="message-subject"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="Subject"
                    />
                  )}

                  {error && <div className="form-error">{error}</div>}

                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Write a message..."
                  />

                  <button onClick={send}>
                    <Send size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="conversation-empty">
              <MessageSquare size={30} />
              <h2>Select a conversation</h2>
              <p>Customer messages will live here.</p>
            </div>
          )}
        </section>
      </div>

      {show && (
        <div className="modal-overlay" onClick={() => setShow(false)}>
          <div
            className="add-modal module-modal"
            onClick={e => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setShow(false)}>
              <X size={18} />
            </button>

            <span className="eyebrow">NEW CONVERSATION</span>
            <h2>Start a conversation</h2>
            {createError && <div className="form-error">{createError}</div>}

            <div className="modal-form">
              <select value={contactId} onChange={e => setContactId(e.target.value)}>
                <option value="">Choose contact</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name || ''}
                  </option>
                ))}
              </select>

              <select value={channel} onChange={e => setChannel(e.target.value)}>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>

              <button className="add-button" onClick={create}>
                Create conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
