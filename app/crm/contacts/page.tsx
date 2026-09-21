'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronLeft, Plus, Search, UserRound, X } from 'lucide-react'

type Contact = {
  id:string
  first_name:string
  last_name?:string
  email?:string
  phone?:string
  company?:string
  source?:string
  status?:string
  notes?:string
  created_at:string
}

const stages = ['new','contacted','qualified','won']

export default function ContactsPage() {
  const [contacts,setContacts]=useState<Contact[]>([])
  const [query,setQuery]=useState('')
  const [status,setStatus]=useState('all')
  const [showAdd,setShowAdd]=useState(false)
  const [selected,setSelected]=useState<Contact|null>(null)
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({firstName:'',lastName:'',email:'',phone:'',company:'',status:'new',notes:''})
  const [error,setError]=useState('')

  async function load(){
    const r=await fetch('/api/crm/contacts')
    const d=await r.json()
    if(r.ok) setContacts(d.contacts||[])
  }
  useEffect(()=>{load()},[])

  const filtered=useMemo(()=>contacts.filter(c=>{
    const hay=[c.first_name,c.last_name,c.email,c.phone,c.company].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(query.toLowerCase()) && (status==='all'||(c.status||'new')===status)
  }),[contacts,query,status])

  async function add(e:FormEvent){
    e.preventDefault();setError('');setSaving(true)
    const r=await fetch('/api/crm/contacts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const d=await r.json();setSaving(false)
    if(!r.ok){setError(d.error||'Unable to create contact');return}
    setContacts(p=>[d.contact,...p]);setShowAdd(false);setForm({firstName:'',lastName:'',email:'',phone:'',company:'',status:'new',notes:''})
  }

  return <main className="module-page">
    <header className="module-top"><div><a href="/crm/dashboard" className="back-link"><ChevronLeft size={15}/> Dashboard</a><span className="eyebrow">CUSTOMER SYSTEM</span><h1>Contacts</h1><p>Every lead and customer in one place.</p></div><button className="add-button" onClick={()=>setShowAdd(true)}><Plus size={17}/> Add contact</button></header>
    <section className="module-toolbar"><label className="module-search"><Search size={16}/><input placeholder="Search contacts..." value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="filter-pills">{['all',...stages].map(item=><button key={item} className={status===item?'selected':''} onClick={()=>setStatus(item)}>{item==='all'?'All':item[0].toUpperCase()+item.slice(1)}</button>)}</div><span className="result-count">{filtered.length} contacts</span></section>
    <section className="contact-list">{filtered.length===0?<div className="empty-module"><UserRound size={28}/><h2>No contacts yet</h2><p>Add your first customer or submit a lead through the public website.</p><button className="add-button" onClick={()=>setShowAdd(true)}><Plus size={17}/> Add contact</button></div>:filtered.map(c=><button className="contact-row" key={c.id} onClick={()=>setSelected(c)}><span className="contact-avatar">{[c.first_name,c.last_name].filter(Boolean).map(x=>x[0]).join('').toUpperCase()}</span><span className="contact-main"><strong>{c.first_name} {c.last_name||''}</strong><small>{c.company||c.email||c.phone||'No company details'}</small></span><span className="contact-source">{c.source||'Manual'}</span><span className={'contact-status '+(c.status||'new')}>{(c.status||'new').replace(/^./,x=>x.toUpperCase())}</span><ArrowRight size={16}/></button>)}</section>

    {showAdd&&<div className="modal-overlay" onClick={()=>setShowAdd(false)}><form className="add-modal module-modal" onSubmit={add} onClick={e=>e.stopPropagation()}><button type="button" className="modal-close" onClick={()=>setShowAdd(false)}><X size={18}/></button><span className="eyebrow">NEW CONTACT</span><h2>Add a contact</h2><div className="modal-form"><input placeholder="First name" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required/><input placeholder="Last name" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/><input placeholder="Email address" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Phone number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input placeholder="Company or property" value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{stages.map(x=><option key={x} value={x}>{x[0].toUpperCase()+x.slice(1)}</option>)}</select><textarea placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>{error&&<div className="auth-error">{error}</div>}<button className="add-button" disabled={saving}>{saving?'Creating...':'Create contact'}</button></div></form></div>}

    {selected&&<ContactDrawer contact={selected} onClose={()=>setSelected(null)} onSaved={(c)=>{setContacts(p=>p.map(x=>x.id===c.id?c:x));setSelected(c)}}/>}
  </main>
}

function ContactDrawer({contact,onClose,onSaved}:{contact:Contact,onClose:()=>void,onSaved:(c:Contact)=>void}){
  const [form,setForm]=useState({firstName:contact.first_name,lastName:contact.last_name||'',email:contact.email||'',phone:contact.phone||'',company:contact.company||'',status:contact.status||'new',notes:contact.notes||''})
  const [activities,setActivities]=useState<any[]>([])
  const [note,setNote]=useState('')
  const [saving,setSaving]=useState(false)

  useEffect(()=>{fetch('/api/crm/activities?contactId='+contact.id).then(r=>r.json()).then(d=>setActivities(d.activities||[]))},[contact.id])

  async function save(){
    setSaving(true)
    const r=await fetch('/api/crm/contacts',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:contact.id,...form})})
    const d=await r.json();setSaving(false)
    if(r.ok) onSaved(d.contact)
  }
  async function addNote(){
    if(!note.trim()) return
    const r=await fetch('/api/crm/activities',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contactId:contact.id,type:'note',title:'Note added',body:note})})
    const d=await r.json()
    if(r.ok){setActivities(p=>[d.activity,...p]);setNote('')}
  }

  return <div className="drawer-overlay" onClick={onClose}><aside className="contact-drawer" onClick={e=>e.stopPropagation()}><header><div><span className="eyebrow">CONTACT</span><h2>{contact.first_name} {contact.last_name||''}</h2></div><button className="modal-close" onClick={onClose}><X size={18}/></button></header><div className="drawer-body"><section className="drawer-section"><h3>Details</h3><div className="drawer-fields"><input value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/><input value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{stages.map(x=><option key={x} value={x}>{x[0].toUpperCase()+x.slice(1)}</option>)}</select><textarea value={form.notes} placeholder="Internal notes" onChange={e=>setForm({...form,notes:e.target.value})}/></div><button className="add-button" onClick={save} disabled={saving}>{saving?'Saving...':'Save changes'}</button></section><section className="drawer-section"><h3>Activity</h3><div className="note-box"><textarea placeholder="Add a note..." value={note} onChange={e=>setNote(e.target.value)}/><button onClick={addNote}>Add note</button></div><div className="activity-list">{activities.map(a=><article key={a.id}><span className="activity-dot"/><div><strong>{a.title}</strong><p>{a.body}</p><small>{new Date(a.created_at).toLocaleString()}</small></div></article>)}{!activities.length&&<p className="muted">No activity yet.</p>}</div></section></div></aside></div>
}
