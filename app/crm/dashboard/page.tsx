'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, Building2, CalendarDays, CarFront, CheckSquare, ChevronDown, CircleHelp, LayoutDashboard, Menu, MessageSquare, MoreHorizontal, Plus, Search, Settings, Users, X } from 'lucide-react'

const nav=[
 {label:'Overview',href:'/crm/dashboard',icon:LayoutDashboard},
 {label:'Contacts',href:'/crm/contacts',icon:Users},
 {label:'Pipeline',href:'/crm/pipeline',icon:ChevronDown},
 {label:'Conversations',href:'/crm/conversations',icon:MessageSquare},
 {label:'Tasks',href:'/crm/tasks',icon:CheckSquare},
 {label:'Appointments',href:'/crm/appointments',icon:CalendarDays},
 {label:'Automations',href:'/crm/automations',icon:ChevronDown},
]

export default function Dashboard(){
 const [user,setUser]=useState<any>(null)
 const [contacts,setContacts]=useState<any[]>([])
 const [tasks,setTasks]=useState<any[]>([])
 const [appointments,setAppointments]=useState<any[]>([])
 const [stages,setStages]=useState<any[]>([])
 const [unreadConversations,setUnreadConversations]=useState(0)
 const [showAdd,setShowAdd]=useState(false)
 const [form,setForm]=useState({firstName:'',lastName:'',email:'',phone:'',company:''})
 const [saving,setSaving]=useState(false)
 const [query,setQuery]=useState('')

 useEffect(()=>{
  Promise.all([fetch('/api/crm/auth/me'),fetch('/api/crm/contacts'),fetch('/api/crm/tasks'),fetch('/api/crm/appointments'),fetch('/api/crm/pipeline'),fetch('/api/crm/conversations')]).then(async ([a,b,c,d,e])=>{
   if(a.status===401){window.location.href='/crm/login';return}
   const [ad,bd,cd,dd,ed,fd]=await Promise.all([a.json(),b.json(),c.json(),d.json(),e.json(),(await fetch('/api/crm/conversations')).json()])
   setUser(ad.user);setContacts(bd.contacts||[]);setTasks(cd.tasks||[]);setAppointments(dd.appointments||[]);setStages(ed.stages||[]);setUnreadConversations((fd.conversations||[]).reduce((sum:any,item:any)=>sum+Number(item.unread_count||0),0))
  })
 },[])

 const filtered=useMemo(()=>contacts.filter(c=>[c.first_name,c.last_name,c.email,c.company].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase())),[contacts,query])
 const openTasks=tasks.filter(t=>!t.completed_at).length
 const upcoming=appointments.filter(a=>a.status==='scheduled').length
 const stageCount=(s:string)=>contacts.filter(c=>(c.status||'new')===s).length

 async function add(){
  setSaving(true)
  const r=await fetch('/api/crm/contacts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
  const d=await r.json();setSaving(false)
  if(r.ok){setContacts(p=>[d.contact,...p]);setShowAdd(false);setForm({firstName:'',lastName:'',email:'',phone:'',company:''})}
 }
 async function logout(){await fetch('/api/crm/auth/logout',{method:'POST'});window.location.href='/crm/login'}

 return <main className="crm">
  <aside className="crm-sidebar">
   <div className="crm-brand"><div className="crm-mark">M</div><div><strong>Market Method</strong><span>Customer System</span></div></div>
   <div className="workspace"><span>WORKSPACE</span><button><span className="workspace-dot">{(user?.organization_name||'M')[0]}</span>{user?.organization_name||'Your business'}<ChevronDown size={14}/></button></div>
   <nav className="crm-nav">{nav.map(({label,href,icon:Icon})=><a key={label} href={href} className={label==='Overview'?'active':''}><Icon size={17} strokeWidth={1.8}/><span>{label}</span>{label==='Conversations'&&unreadConversations>0&&<em>{unreadConversations}</em>}</a>)}</nav>
   <div className="sidebar-bottom"><a href="/crm/settings"><Settings size={17}/><span>Settings</span></a><a href="/crm/help"><CircleHelp size={17}/><span>Help</span></a><div className="user-chip"><span className="avatar">{(user?.name||'U').split(' ').map((x:string)=>x[0]).join('').slice(0,2)}</span><span><strong>{user?.name||'Loading'}</strong><small>{user?.role||'Owner'}</small></span><button onClick={logout}><MoreHorizontal size={17}/></button></div></div>
  </aside>
  <section className="crm-main">
   <header className="crm-header"><div><span className="crumb">{user?.organization_name||'Workspace'}</span><h1>Overview</h1></div><div className="header-actions"><label className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search customers..."/></label><button className="icon-button"><Bell size={18}/></button><button className="add-button" onClick={()=>setShowAdd(true)}><Plus size={17}/> Add customer</button></div></header>
   <div className="dashboard">
    <div className="welcome"><div><span className="eyebrow">CUSTOMER SYSTEM</span><h2>Here’s what needs attention.</h2><p>Keep the customer journey moving without keeping everything in your head.</p></div><a className="outline-button" href="/crm/appointments"><CalendarDays size={16}/> View calendar</a></div>
    <div className="metrics"><article className="metric"><span>Contacts</span><strong>{contacts.length}</strong><small className="positive">Total customer records</small></article><article className="metric"><span>Follow-ups due</span><strong>{openTasks}</strong><small className="warning">Open tasks</small></article><article className="metric"><span>Appointments</span><strong>{upcoming}</strong><small className="neutral">Scheduled</small></article><article className="metric"><span>Unread conversations</span><strong>{unreadConversations}</strong><small className={unreadConversations?'warning':'neutral'}>{unreadConversations?'Needs a response':'Inbox clear'}</small></article></div>
    <div className="dashboard-grid">
     <section className="panel pipeline-panel"><div className="panel-head"><div><span className="eyebrow">PIPELINE</span><h3>Leads in motion</h3></div><a className="text-action" href="/crm/pipeline">View pipeline</a></div><div className="pipeline">{(stages.length?stages:[{name:'New'},{name:'Contacted'},{name:'Qualified'},{name:'Won'}]).map((stage:any)=><div className="pipeline-stage" key={stage.id||stage.name}><div><span>{stage.name}</span><strong>{stageCount(String(stage.name).toLowerCase())}</strong></div><div className="stage-line"><i style={{width:Math.max(stageCount(String(stage.name).toLowerCase())*25,stageCount(String(stage.name).toLowerCase())?25:0)+'%'}}/></div></div>)}</div></section>
     <section className="panel attention-panel"><div className="panel-head"><div><span className="eyebrow">FOLLOW-UP</span><h3>Needs attention</h3></div><span className="count-badge">{openTasks}</span></div><div className="task-list">{tasks.filter(t=>!t.completed_at).slice(0,4).map(t=><div className="task" key={t.id}><button className="task-check"/><div><strong>{t.title}</strong><span>{[t.first_name,t.last_name].filter(Boolean).join(' ')||'General task'}</span></div><small>{t.due_at?new Date(t.due_at).toLocaleDateString():'No due date'}</small></div>)}{!openTasks&&<div className="soft-empty">No open follow-ups.</div>}</div></section>
    </div>
    <section className="panel leads-panel"><div className="panel-head"><div><span className="eyebrow">RECENT ACTIVITY</span><h3>Recent contacts</h3></div><a className="text-action" href="/crm/contacts">View all contacts</a></div><div className="lead-table"><div className="table-row table-head"><span>CONTACT</span><span>SOURCE</span><span>STATUS</span><span>CREATED</span><span/></div>{filtered.slice(0,8).map(c=><a className="table-row" key={c.id} href="/crm/contacts"><span className="contact-cell"><b>{[c.first_name,c.last_name].filter(Boolean).map((x:string)=>x[0]).join('').toUpperCase()}</b><strong>{c.first_name} {c.last_name||''}<small>{c.company||c.email||'No details'}</small></strong></span><span>{c.source||'Manual'}</span><span><i className={'status-dot '+(c.status||'new')}/>{(c.status||'new')[0].toUpperCase()+(c.status||'new').slice(1)}</span><span>{new Date(c.created_at).toLocaleDateString()}</span><MoreHorizontal size={17}/></a>)}{!filtered.length&&<div className="soft-empty">No contacts yet. Add one or submit a lead from the public site.</div>}</div></section>
   </div>
  </section>
  {showAdd&&<div className="modal-overlay" onClick={()=>setShowAdd(false)}><div className="add-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowAdd(false)}><X size={18}/></button><span className="eyebrow">NEW CUSTOMER</span><h2>Add a customer</h2><p>This creates a customer record in the current workspace.</p><div className="modal-form"><input placeholder="First name" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/><input placeholder="Last name" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/><input placeholder="Email address" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Phone number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input placeholder="Company or property" value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/><button className="add-button" onClick={add} disabled={saving}>{saving?'Creating...':'Create customer'}</button></div></div></div>}
 </main>
}
