'use client'
import {FormEvent,useEffect,useState} from 'react'
import {Check,ChevronLeft,Plus,X} from 'lucide-react'

export default function TasksPage(){
 const [tasks,setTasks]=useState<any[]>([]),[contacts,setContacts]=useState<any[]>([]),[users,setUsers]=useState<any[]>([]),[show,setShow]=useState(false)
 const [form,setForm]=useState({title:'',description:'',contactId:'',assignedTo:'',dueAt:''})
 useEffect(()=>{load()},[])
 async function load(){
  const [t,c,s]=await Promise.all([fetch('/api/crm/tasks'),fetch('/api/crm/contacts'),fetch('/api/crm/settings')])
  const [td,cd,sd]=await Promise.all([t.json(),c.json(),s.json()])
  if(t.ok)setTasks(td.tasks||[])
  if(c.ok)setContacts(cd.contacts||[])
  if(s.ok)setUsers(sd.users||[])
 }
 async function add(e:FormEvent){
  e.preventDefault()
  const r=await fetch('/api/crm/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
  const d=await r.json()
  if(r.ok){setTasks(p=>[d.task,...p]);setShow(false);setForm({title:'',description:'',contactId:'',assignedTo:'',dueAt:''})}
 }
 async function complete(id:string,completed:boolean){
  const r=await fetch('/api/crm/tasks',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,completed})})
  const d=await r.json()
  if(r.ok)setTasks(p=>p.map(t=>t.id===id?{...t,...d.task}:t))
 }
 const open=tasks.filter(t=>!t.completed_at),done=tasks.filter(t=>t.completed_at)
 return <main className="module-page">
  <header className="module-top"><div><a href="/crm/dashboard" className="back-link"><ChevronLeft size={15}/> Dashboard</a><span className="eyebrow">FOLLOW-UP</span><h1>Tasks</h1><p>Keep every follow-up visible and assigned.</p></div><button className="add-button" onClick={()=>setShow(true)}><Plus size={17}/> Add task</button></header>
  <div className="task-columns"><TaskColumn title="Open" items={open} complete={complete}/><TaskColumn title="Completed" items={done} complete={complete}/></div>
  {show&&<div className="modal-overlay" onClick={()=>setShow(false)}><form className="add-modal module-modal" onSubmit={add} onClick={e=>e.stopPropagation()}><button type="button" className="modal-close" onClick={()=>setShow(false)}><X size={18}/></button><span className="eyebrow">FOLLOW-UP</span><h2>Create a task</h2><div className="modal-form"><input placeholder="Task title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/><select value={form.contactId} onChange={e=>setForm({...form,contactId:e.target.value})}><option value="">No contact</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name||''}</option>)}</select><select value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})}><option value="">Assign to me</option>{users.map(u=><option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}</select><textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><input type="datetime-local" value={form.dueAt} onChange={e=>setForm({...form,dueAt:e.target.value})}/><button className="add-button">Create task</button></div></form></div>}
 </main>
}

function TaskColumn({title,items,complete}:{title:string,items:any[],complete:(id:string,c:boolean)=>void}){
 return <section className="task-column"><header><h2>{title}</h2><span>{items.length}</span></header>{items.map(t=><article className={'task-row-card '+(t.completed_at?'done':'')} key={t.id}><button className="circle-check" onClick={()=>complete(t.id,!t.completed_at)}>{t.completed_at&&<Check size={13}/>}</button><div><strong>{t.title}</strong><small>{[t.first_name,t.last_name].filter(Boolean).join(' ')||'General task'}{t.assigned_name?' · '+t.assigned_name:''}{t.due_at?' · '+new Date(t.due_at).toLocaleString():''}</small><p>{t.description}</p></div></article>)}{!items.length&&<div className="soft-empty">Nothing here.</div>}</section>
}
