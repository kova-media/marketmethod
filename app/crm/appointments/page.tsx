'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ChevronLeft, Plus, X } from 'lucide-react'

export default function AppointmentsPage(){
 const [items,setItems]=useState<any[]>([])
 const [show,setShow]=useState(false)
 const [form,setForm]=useState({title:'',startsAt:'',endsAt:'',notes:''})
 const [saving,setSaving]=useState(false)
 async function load(){const r=await fetch('/api/crm/appointments');const d=await r.json();if(r.ok)setItems(d.appointments||[])}
 useEffect(()=>{load()},[])
 async function add(e:FormEvent){e.preventDefault();setSaving(true);const r=await fetch('/api/crm/appointments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const d=await r.json();setSaving(false);if(r.ok){setItems(p=>[...p,d.appointment].sort((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime()));setShow(false);setForm({title:'',startsAt:'',endsAt:'',notes:''})}}
 async function status(id:string,status:string){const r=await fetch('/api/crm/appointments',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})});const d=await r.json();if(r.ok)setItems(p=>p.map(x=>x.id===id?d.appointment:x))}
 return <main className="module-page">
  <header className="module-top"><div><a href="/crm/dashboard" className="back-link"><ChevronLeft size={15}/> Dashboard</a><span className="eyebrow">SCHEDULE</span><h1>Appointments</h1><p>See upcoming customer commitments and what happened.</p></div><button className="add-button" onClick={()=>setShow(true)}><Plus size={17}/> Add appointment</button></header>
  <section className="appointment-list">{items.length===0?<div className="empty-module"><h2>No appointments yet</h2><p>Appointments created in the CRM will appear here.</p><button className="add-button" onClick={()=>setShow(true)}><Plus size={17}/> Add appointment</button></div>:items.map(a=><article className="appointment-row" key={a.id}><div className="appointment-date"><strong>{new Date(a.starts_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</strong><small>{new Date(a.starts_at).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</small></div><div className="appointment-main"><strong>{a.title}</strong><small>{[a.first_name,a.last_name].filter(Boolean).join(' ')||'No contact assigned'}</small><p>{a.notes||''}</p></div><select value={a.status} onChange={e=>status(a.id,e.target.value)}><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No show</option></select></article>)}</section>
  {show&&<div className="modal-overlay" onClick={()=>setShow(false)}><form className="add-modal module-modal" onSubmit={add} onClick={e=>e.stopPropagation()}><button type="button" className="modal-close" onClick={()=>setShow(false)}><X size={18}/></button><span className="eyebrow">SCHEDULE</span><h2>Add appointment</h2><div className="modal-form"><input placeholder="Appointment title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/><input type="datetime-local" value={form.startsAt} onChange={e=>setForm({...form,startsAt:e.target.value})} required/><input type="datetime-local" value={form.endsAt} onChange={e=>setForm({...form,endsAt:e.target.value})}/><textarea placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/><button className="add-button" disabled={saving}>{saving?'Creating...':'Create appointment'}</button></div></form></div>}
 </main>
}
