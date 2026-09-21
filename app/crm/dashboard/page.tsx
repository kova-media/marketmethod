'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarDays, CheckSquare, ChevronDown, CircleHelp, LayoutDashboard, Menu, MessageSquare, MoreHorizontal, Plus, Search, Settings, Users, X } from 'lucide-react'

const demoLeads = [
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

export default function CRMDashboard() {
  const [active, setActive] = useState('Overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [form, setForm] = useState({ firstName:'', lastName:'', phone:'', email:'', company:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/crm/auth/me').then(r=>r.ok?r.json():Promise.reject()).then(data=>{
      setSession(data.user)
      return fetch('/api/crm/contacts?organizationId='+data.user.organization_id)
    }).then(r=>r.json()).then(data=>{ if (data.contacts) setContacts(data.contacts) }).catch(()=>{})
  }, [])

  const filteredLeads = useMemo(() => {
    const source = contacts.length ? contacts.map(c=>({name:[c.first_name,c.last_name].filter(Boolean).join(' '),company:c.company||'',source:c.source||'Manual',status:c.status||'New',time:new Date(c.created_at).toLocaleDateString()})) : demoLeads
    return source.filter(lead => (lead.name+' '+lead.company+' '+lead.source).toLowerCase().includes(query.toLowerCase()))
  }, [query, contacts])

  async function createCustomer() {
    if (!form.firstName.trim() || !session) return
    setSaving(true)
    const response = await fetch('/api/crm/contacts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({organizationId:session.organization_id,...form,status:'new'})})
    const data=await response.json()
    setSaving(false)
    if (response.ok && data.contact) { setContacts(prev=>[data.contact,...prev]); setForm({firstName:'',lastName:'',phone:'',email:'',company:''}); setShowAdd(false) }
  }

  async function logout() { await fetch('/api/crm/auth/logout',{method:'POST'}); window.location.href='/crm/login' }

  return <main className="crm">
    <aside className={'crm-sidebar '+(mobileOpen?'open':'')}>
      <div className="crm-brand"><div className="crm-mark">M</div><div><strong>Market Method</strong><span>Customer System</span></div><button className="mobile-close" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"><X size={18}/></button></div>
      <div className="workspace"><span>WORKSPACE</span><button><span className="workspace-dot">{session?.organization_name?.[0]||'M'}</span>{session?.organization_name||'Market Method'} <ChevronDown size={14}/></button></div>
      <nav className="crm-nav">{nav.map(item=>{const Icon=item.icon;return <button key={item.label} className={active===item.label?'active':''} onClick={()=>{setActive(item.label);setMobileOpen(false)}}><Icon size={17} strokeWidth={1.8}/><span>{item.label}</span>{item.label==='Conversations'&&<em>4</em>}</button>})}</nav>
      <div className="sidebar-bottom"><button><Settings size={17}/><span>Settings</span></button><button><CircleHelp size={17}/><span>Help</span></button><button className="user-chip" onClick={logout}><span className="avatar">{session?.name?.split(' ').map((n:string)=>n[0]).join('')||'MM'}</span><span><strong>{session?.name||'Account'}</strong><small>{session?.role||'Owner'} · Sign out</small></span><MoreHorizontal size={17}/></button></div>
    </aside>
    <section className="crm-main">
      <header className="crm-header"><button className="mobile-menu" onClick={()=>setMobileOpen(true)} aria-label="Open navigation"><Menu size={20}/></button><div><span className="crumb">{session?.organization_name||'Market Method'}</span><h1>{active}</h1></div><div className="header-actions"><label className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search customers..."/></label><button className="icon-button" aria-label="Notifications"><Bell size={18}/><i/></button><button className="add-button" onClick={()=>setShowAdd(true)}><Plus size={17}/> Add customer</button></div></header>
      {active==='Overview'?<div className="dashboard">
        <div className="welcome"><div><span className="eyebrow">CUSTOMER SYSTEM</span><h2>Here’s what needs attention.</h2><p>Keep the customer journey moving without keeping everything in your head.</p></div><button className="outline-button"><CalendarDays size={16}/> View calendar</button></div>
        <div className="metrics">{[['New leads',contacts.length?String(contacts.filter(c=>c.status==='new').length):'8','Live from CRM','positive'],['Follow-ups due','14','6 due today','warning'],['Appointments','23','Next: 10:30 AM','neutral'],['Open conversations','4','2 need a reply','warning']].map(([label,value,note,tone])=><article className="metric" key={label as string}><span>{label}</span><strong>{value}</strong><small className={tone as string}>{note}</small></article>)}</div>
        <div className="dashboard-grid"><section className="panel pipeline-panel"><div className="panel-head"><div><span className="eyebrow">PIPELINE</span><h3>Leads in motion</h3></div><button className="text-action" onClick={()=>setActive('Pipeline')}>View pipeline</button></div><div className="pipeline">{['New','Contacted','Qualified','Won'].map(stage=>{const count=contacts.length?contacts.filter(c=>(c.status||'').toLowerCase()===stage.toLowerCase()).length:demoLeads.filter(l=>l.status===stage).length;return <div className="pipeline-stage" key={stage}><div><span>{stage}</span><strong>{count}</strong></div><div className="stage-line"><i style={{width:Math.max(count*25,25)+'%'}}/></div></div>})}</div></section>
        <section className="panel attention-panel"><div className="panel-head"><div><span className="eyebrow">TODAY</span><h3>Needs attention</h3></div><span className="count-badge">14</span></div><div className="task-list">{tasks.map(task=><div className="task" key={task.title}><button className={'task-check '+(task.urgent?'urgent':'')} aria-label={'Complete '+task.title}/><div><strong>{task.title}</strong><span>{task.detail}</span></div><small>{task.due}</small></div>)}</div></section></div>
        <section className="panel leads-panel"><div className="panel-head"><div><span className="eyebrow">CUSTOMERS</span><h3>{contacts.length?'Recent contacts':'Recent leads'}</h3></div><button className="text-action" onClick={()=>setActive('Contacts')}>View all contacts</button></div><div className="lead-table"><div className="table-row table-head"><span>CONTACT</span><span>SOURCE</span><span>STATUS</span><span>ACTIVITY</span><span/></div>{filteredLeads.map((lead:any)=><div className="table-row" key={lead.name}><span className="contact-cell"><b>{lead.name.split(' ').map((n:string)=>n[0]).join('')}</b><strong>{lead.name}<small>{lead.company}</small></strong></span><span>{lead.source}</span><span><i className={'status-dot '+String(lead.status).toLowerCase()}/>{lead.status}</span><span>{lead.time}</span><button className="row-more" aria-label="More options"><MoreHorizontal size={17}/></button></div>)}</div></section>
      </div>:<div className="empty-view"><span className="eyebrow">CRM MODULE</span><h2>{active}</h2><p>This module uses the same customer records, activities, and organization data as the dashboard.</p><button className="add-button" onClick={()=>setShowAdd(true)}><Plus size={17}/> Add customer</button></div>}
    </section>
    {showAdd&&<div className="modal-overlay" onClick={()=>setShowAdd(false)}><div className="add-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowAdd(false)}><X size={18}/></button><span className="eyebrow">NEW CUSTOMER</span><h2>Add a customer</h2><p>The customer record becomes the central record for leads, conversations, appointments, and follow-up.</p><div className="modal-form"><input placeholder="First name" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/><input placeholder="Last name" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/><input placeholder="Phone number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input placeholder="Email address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Company or property" value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/><button className="add-button" disabled={saving} onClick={createCustomer}>{saving?'Creating...':'Create customer'}</button></div></div></div>}
  </main>
}
