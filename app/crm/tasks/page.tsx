'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, ChevronLeft, Plus, X } from 'lucide-react'

export default function TasksPage(){
 const [tasks,setTasks]=useState<any[]>([])
 const [show,setShow]=useState(false)
 const [form,setForm]=useState({title:'',description:'',dueAt:''})
 const [saving,setSaving]=useState(false)
 async function load(){const r=await fetch('/api/crm/tasks');const d=await r.json();if(r.ok)setTasks(d.tasks||[])}
 useEffect(()=>{load()},[])
 async function add(e:FormEvent){e.preventDefault();setSaving(true);const r=await fetch('/api/crm/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const d=await r.json();setSaving(false);if(r.ok){setTasks(p=>[d.task,...p]);setShow(false);setForm({title:'',description:'',dueAt:''})}}
 async function complete(id:string,completed:boolean){const r=await fetch('/api/crm/tasks',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,completed})});const d=await r.json();if(r.ok)setTasks(p=>p.map(t=>t.id===id?d.task:t))}
 const open=tasks.filter(t=>!t.completed_at),done=tasks.filter(t=>t.completed_at)
 return <main className="module-page">
  <header className="module-top"><div><a href="/crm/dashboard" className="back-link"><ChevronLeft size={15}/> Dashboard</a><span className="eyebrow">FOLLOW-UP</span><h1>Tasks</h1><p>Keep every follow-up visible and assigned.</p></div><button className="add-button" onClick={()=>setShow(true)}><Plus size={17}/> Add task</button></header>
  <div className="task-columns"><section className="task-column"><header><h2>Open</h2><span>{open.length}</span></header>{open.map(t=><TaskRow key={t.id} task={t} onComplete={()=>complete(t.id,true)}/>) }{!open.length&&<div className="soft-empty">No open tasks.</div>}</section><section className="task-column"><header><h2>Completed</h2><span>{done.length}</span></header>{done.map(t=><TaskRow key={t.id} task={t} onComplete={()=>complete(t.id,false)}/>) }{!done.length&&<div className="soft-empty">Nothing completed yet.</div>}</section></div>
  {show&&<div className="modal-overlay" onClick={()=>setShow(false)}><form className="add-modal module-modal" onSubmit={add} onClick={e=>e.stopPropagation()}><button type="button" className="modal-close" onClick={()=>setShow(false)}><X size={18}/></button><span className="eyebrow">FOLLOW-UP</span><h2>Create a task</h2><div className="modal-form"><input placeholder="Task title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/><textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><input type="datetime-local" value={form.dueAt} onChange={e=>setForm({...form,dueAt:e.target.value})}/><button className="add-button" disabled={saving}>{saving?'Creating...':'Create task'}</button></div></form></div>}
 </main>
}

function TaskRow({task,onComplete}:{task:any,onComplete:()=>void}){return <article className={'task-row-card '+(task.completed_at?'done':'')}><button className="circle-check" onClick={onComplete} aria-label={task.completed_at?'Reopen task':'Complete task'}>{task.completed_at&&<Check size={13}/>}</button><div><strong>{task.title}</strong><small>{[task.first_name,task.last_name].filter(Boolean).join(' ')||'General task'}{task.due_at?' · '+new Date(task.due_at).toLocaleString():''}</small><p>{task.description}</p></div></article>}
