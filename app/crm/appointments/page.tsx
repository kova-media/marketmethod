'use client'
import {FormEvent,useEffect,useMemo,useState} from 'react'
import {ChevronLeft,Plus,X} from 'lucide-react'

type Appointment={id:string,title:string,starts_at:string,ends_at?:string|null,status:string,notes?:string|null,first_name?:string|null,last_name?:string|null}

export default function AppointmentsPage(){
 const [items,setItems]=useState<Appointment[]>([]),[contacts,setContacts]=useState<any[]>([]),[show,setShow]=useState(false),[filter,setFilter]=useState('upcoming')
 const [form,setForm]=useState({title:'',contactId:'',startsAt:'',endsAt:'',notes:''})
 useEffect(()=>{load()},[])
 async function load(){
  const [a,c]=await Promise.all([fetch('/api/crm/appointments'),fetch('/api/crm/contacts')])
  const [ad,cd]=await Promise.all([a.json(),c.json()])
  if(a.ok)setItems(ad.appointments||[])
  if(c.ok)setContacts(cd.contacts||[])
 }
 async function add(e:FormEvent){
  e.preventDefault()
  if(form.endsAt&&new Date(form.endsAt).getTime()<=new Date(form.startsAt).getTime())return
  const r=await fetch('/api/crm/appointments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
  const d=await r.json()
  if(r.ok){setItems(p=>[...p,d.appointment].sort((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime()));setShow(false);setForm({title:'',contactId:'',startsAt:'',endsAt:'',notes:''})}
 }
 async function status(id:string,value:string){
  const r=await fetch('/api/crm/appointments',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:value})})
  const d=await r.json()
  if(r.ok)setItems(p=>p.map(x=>x.id===id?{...d.appointment,first_name:x.first_name,last_name:x.last_name}:x))
 }
 const now=Date.now()
 const todayStart=new Date();todayStart.setHours(0,0,0,0)
 const tomorrow=new Date(todayStart);tomorrow.setDate(tomorrow.getDate()+1)
 const counts={
  upcoming:items.filter(a=>new Date(a.starts_at).getTime()>=now&&a.status==='scheduled').length,
  today:items.filter(a=>new Date(a.starts_at)>=todayStart&&new Date(a.starts_at)<tomorrow).length,
  completed:items.filter(a=>a.status==='completed').length,
  past:items.filter(a=>new Date(a.starts_at).getTime()<now&&a.status==='scheduled').length
 }
 const visible=useMemo(()=>items.filter(a=>{
  if(filter==='today')return new Date(a.starts_at)>=todayStart&&new Date(a.starts_at)<tomorrow
  if(filter==='completed')return a.status==='completed'
  if(filter==='past')return new Date(a.starts_at).getTime()<Date.now()&&a.status==='scheduled'
  return new Date(a.starts_at).getTime()>=Date.now()&&a.status==='scheduled'
 }),[items,filter])
 return <main className="module-page">
  <header className="module-top"><div><a href="/crm/dashboard" className="back-link"><ChevronLeft size={15}/> Dashboard</a><span className="eyebrow">SCHEDULE</span><h1>Appointments</h1><p>See upcoming customer commitments and what happened.</p></div><button className="add-button" onClick={()=>setShow(true)}><Plus size={17}/> Add appointment</button></header>
  <section className="module-toolbar"><div className="filter-pills">
   {[
    ['upcoming',`Upcoming ${counts.upcoming}`],
    ['today',`Today ${counts.today}`],
    ['past',`Past due ${counts.past}`],
    ['completed',`Completed ${counts.completed}`]
   ].map(([value,label])=><button key={value} className={filter===value?'selected':''} onClick={()=>setFilter(value)}>{label}</button>)}
  </div><span className="result-count">{visible.length} appointments</span></section>
  <section className="appointment-list">
   {visible.length?visible.map(a=><article className="appointment-row" key={a.id}>
    <div className="appointment-date"><strong>{new Date(a.starts_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</strong><small>{new Date(a.starts_at).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</small></div>
    <div className="appointment-main"><strong>{a.title}</strong><small>{[a.first_name,a.last_name].filter(Boolean).join(' ')||'No contact assigned'}</small><p>{a.notes||''}</p></div>
    <select value={a.status} onChange={e=>status(a.id,e.target.value)}><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No show</option></select>
   </article>):<div className="empty-module"><h2>No appointments here</h2><p>Change the filter or create a new appointment.</p><button className="add-button" onClick={()=>setShow(true)}><Plus size={17}/> Add appointment</button></div>}
  </section>
  {show&&<div className="modal-overlay" onClick={()=>setShow(false)}><form className="add-modal module-modal" onSubmit={add} onClick={e=>e.stopPropagation()}><button type="button" className="modal-close" onClick={()=>setShow(false)}><X size={18}/></button><span className="eyebrow">SCHEDULE</span><h2>Add appointment</h2><div className="modal-form">
   <input placeholder="Appointment title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
   <select value={form.contactId} onChange={e=>setForm({...form,contactId:e.target.value})}><option value="">No customer assigned</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name||''}{c.phone?' · '+c.phone:''}</option>)}</select>
   <input type="datetime-local" value={form.startsAt} onChange={e=>setForm({...form,startsAt:e.target.value})} required/>
   <input type="datetime-local" value={form.endsAt} min={form.startsAt||undefined} onChange={e=>setForm({...form,endsAt:e.target.value})}/>
   <textarea placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
   <button className="add-button">Create appointment</button>
  </div></form></div>}
 </main>
}
