'use client'

import { useMemo, useState } from 'react'
import { Bell, CalendarDays, CheckSquare, ChevronDown, CircleHelp, LayoutDashboard, Menu, MessageSquare, MoreHorizontal, Plus, Search, Settings, Users, X } from 'lucide-react'

const leads = [
  { name: 'Marcus Hill', company: 'Hill Roofing', source: 'Website', status: 'New', time: '12 min ago' },
  { name: 'Sarah Bennett', company: 'Bennett Dental', source: 'Google', status: 'Contacted', time: '42 min ago' },
  { name: 'James Carter', company: 'Carter Auto', source: 'Referral', status: 'Qualified', time: '2 hr ago' },
  { name: 'Emily Brooks', company: 'Brooks Landscaping', source: 'Website', status: 'Won', time: 'Yesterday' },
]

const tasks = [
  { title: 'Follow up with Marcus Hill', detail: 'Hill Roofing · New lead', due: 'Due today', urgent: true },
  { title: 'Call Sarah Bennett', detail: 'Bennett Dental · Quote requested', due: 'Due today', urgent: true },
  { title: 'Send service reminder', detail: 'Carter Auto · 6-month service', due: 'Tomorrow', urgent: false },
]

const nav = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Contacts', icon: Users },
  { label: 'Pipeline', icon: ChevronDown },
  { label: 'Conversations', icon: MessageSquare },
  { label: 'Tasks', icon: CheckSquare },
  { label: 'Appointments', icon: CalendarDays },
]

export default function CRMPage() {
  const [active, setActive] = useState('Overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const filteredLeads = useMemo(
    () => leads.filter(lead => (lead.name + ' ' + lead.company + ' ' + lead.source).toLowerCase().includes(query.toLowerCase())),
    [query]
  )

  return (
    <main className="crm">
      <aside className={'crm-sidebar ' + (mobileOpen ? 'open' : '')}>
        <div className="crm-brand">
          <div className="crm-mark">M</div>
          <div><strong>Market Method</strong><span>Customer System</span></div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="workspace">
          <span>WORKSPACE</span>
          <button><span className="workspace-dot">F</span> Fullerton Automotive <ChevronDown size={14} /></button>
        </div>
        <nav className="crm-nav">
          {nav.map(item => {
            const Icon = item.icon
            return <button key={item.label} className={active === item.label ? 'active' : ''} onClick={() => { setActive(item.label); setMobileOpen(false) }}>
              <Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{item.label === 'Conversations' && <em>4</em>}
            </button>
          })}
        </nav>
        <div className="sidebar-bottom">
          <button><Settings size={17} /><span>Settings</span></button>
          <button><CircleHelp size={17} /><span>Help</span></button>
          <div className="user-chip"><span className="avatar">DK</span><span><strong>Damian Kirby</strong><small>Owner</small></span><MoreHorizontal size={17} /></div>
        </div>
      </aside>

      <section className="crm-main">
        <header className="crm-header">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div><span className="crumb">Fullerton Automotive</span><h1>{active}</h1></div>
          <div className="header-actions">
            <label className="search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search customers..." /></label>
            <button className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <button className="add-button" onClick={() => setShowAdd(true)}><Plus size={17} /> Add customer</button>
          </div>
        </header>

        {active === 'Overview' ? (
          <div className="dashboard">
            <div className="welcome">
              <div><span className="eyebrow">MONDAY, SEPTEMBER 21</span><h2>Here’s what needs attention.</h2><p>Keep the customer journey moving without keeping everything in your head.</p></div>
              <button className="outline-button"><CalendarDays size={16} /> View calendar</button>
            </div>

            <div className="metrics">
              {[
                ['New leads', '8', '+3 this week', 'positive'],
                ['Follow-ups due', '14', '6 due today', 'warning'],
                ['Appointments', '23', 'Next: 10:30 AM', 'neutral'],
                ['Open conversations', '4', '2 need a reply', 'warning'],
              ].map(([label, value, note, tone]) => <article className="metric" key={label}><span>{label}</span><strong>{value}</strong><small className={tone}>{note}</small></article>)}
            </div>

            <div className="dashboard-grid">
              <section className="panel pipeline-panel">
                <div className="panel-head"><div><span className="eyebrow">PIPELINE</span><h3>Leads in motion</h3></div><button className="text-action">View pipeline</button></div>
                <div className="pipeline">
                  {['New', 'Contacted', 'Qualified', 'Won'].map(stage => {
                    const count = leads.filter(l => l.status === stage).length
                    return <div className="pipeline-stage" key={stage}><div><span>{stage}</span><strong>{count}</strong></div><div className="stage-line"><i style={{ width: Math.max(count * 25, 25) + '%' }} /></div></div>
                  })}
                </div>
              </section>

              <section className="panel attention-panel">
                <div className="panel-head"><div><span className="eyebrow">TODAY</span><h3>Needs attention</h3></div><span className="count-badge">14</span></div>
                <div className="task-list">
                  {tasks.map(task => <div className="task" key={task.title}><button className={'task-check ' + (task.urgent ? 'urgent' : '')} aria-label={'Complete ' + task.title} /><div><strong>{task.title}</strong><span>{task.detail}</span></div><small>{task.due}</small></div>)}
                </div>
              </section>
            </div>

            <section className="panel leads-panel">
              <div className="panel-head"><div><span className="eyebrow">RECENT ACTIVITY</span><h3>Recent leads</h3></div><button className="text-action">View all contacts</button></div>
              <div className="lead-table">
                <div className="table-row table-head"><span>CONTACT</span><span>SOURCE</span><span>STATUS</span><span>ACTIVITY</span><span /></div>
                {filteredLeads.map(lead => <div className="table-row" key={lead.name}><span className="contact-cell"><b>{lead.name.split(' ').map(n => n[0]).join('')}</b><strong>{lead.name}<small>{lead.company}</small></strong></span><span>{lead.source}</span><span><i className={'status-dot ' + lead.status.toLowerCase()} />{lead.status}</span><span>{lead.time}</span><button className="row-more" aria-label="More options"><MoreHorizontal size={17} /></button></div>)}
              </div>
            </section>
          </div>
        ) : (
          <div className="empty-view"><span className="eyebrow">CRM MODULE</span><h2>{active}</h2><p>This module is part of the CRM foundation and will connect to the same customer records, activities, and organization data.</p><button className="add-button" onClick={() => setShowAdd(true)}><Plus size={17} /> Add customer</button></div>
        )}
      </section>

      {showAdd && <div className="modal-overlay" onClick={() => setShowAdd(false)}><div className="add-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowAdd(false)}><X size={18} /></button><span className="eyebrow">NEW CUSTOMER</span><h2>Add a customer</h2><p>The customer record will become the central record for leads, conversations, appointments, and follow-up.</p><div className="modal-form"><input placeholder="Customer name" /><input placeholder="Phone number" /><input placeholder="Email address" /><input placeholder="Company or property" /><button className="add-button" onClick={() => setShowAdd(false)}>Create customer</button></div></div></div>}
    </main>
  )
}
