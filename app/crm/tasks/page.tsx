'use client'
import {FormEvent,useEffect,useMemo,useState} from 'react'
import {Check,ChevronLeft,Plus,X} from 'lucide-react'

type Task = {
 id:string
 title:string
 description?:string|null
 first_name?:string|null
 last_name?:string|null
 assigned_name?:string|null
 due_at?:string|null
 completed_at?:string|null
}

export default function TasksPage(){
 const [tasks,setTasks]=useState<Task[]>([])
 const [contacts,setContacts]=useState<any[]>([])
 const [users,setUsers]=useState<any[]>([])
 const [show,setShow]=useState(false)
 const [filter,setFilter]=useState('open')
 const [form,setForm]=useState({title:'',description:'',contactId:'',assignedTo:'',dueAt:''})
 const [error,setError]=useState('')

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
  setError('')
  const r=await fetch('/api/crm/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
  const d=await r.json()
  if(r.ok){
   setTasks(p=>[d.task,...p])
   setShow(false)
   setForm({title:'',description:'',contactId:'',assignedTo:'',dueAt:''})
  } else setError(d.error||'Task could not be created.')
 }

 async function complete(id:string,completed:boolean){
  const r=await fetch('/api/crm/tasks',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,completed})})
  const d=await r.json()
  if(r.ok)setTasks(p=>p.map(t=>t.id===id?{...t,...d.task}:t))
 }

 const now=Date.now()
 const startOfToday=new Date()
 startOfToday.setHours(0,0,0,0)
 const endOfToday=new Date(startOfToday)
 endOfToday.setDate(endOfToday.getDate()+1)

 const openCount=tasks.filter(t=>!t.completed_at).length
 const overdueCount=tasks.filter(t=>!t.completed_at&&t.due_at&&new Date(t.due_at || '').getTime()<now).length
 const todayCount=tasks.filter(t=>!t.completed_at&&t.due_at&&new Date(t.due_at || '')>=startOfToday&&new Date(t.due_at || '')<endOfToday).length

 const visible=useMemo(()=>{
  return tasks.filter(t=>{
   if(filter==='completed')return Boolean(t.completed_at)
   if(filter==='overdue')return !t.completed_at&&Boolean(t.due_at)&&new Date(t.due_at || '').getTime()<Date.now()
   if(filter==='today')return !t.completed_at&&Boolean(t.due_at)&&new Date(t.due_at || '')>=startOfToday&&new Date(t.due_at || '')<endOfToday
   return !t.completed_at
  })
 },[tasks,filter])

 const sorted=[...visible].sort((a,b)=>{
  if(!a.due_at&&!b.due_at)return 0
  if(!a.due_at)return 1
  if(!b.due_at)return -1
  return new Date(a.due_at).getTime()-new Date(b.due_at).getTime()
 })

 return <main className="module-page">
  <header className="module-top">
   <div>
    <a href="/crm/dashboard" className="back-link"><ChevronLeft size={15}/> Dashboard</a>
    <span className="eyebrow">FOLLOW-UP</span>
    <h1>Tasks</h1>
    <p>Keep every follow-up visible and assigned.</p>
   </div>
   <button className="add-button" onClick={()=>setShow(true)}><Plus size={17}/> Add task</button>
  </header>

  <section className="module-toolbar">
   <div className="filter-pills">
    {[
     ['open',`Open ${openCount}`],
     ['overdue',`Overdue ${overdueCount}`],
     ['today',`Today ${todayCount}`],
     ['completed',`Completed ${tasks.length-openCount}`]
    ].map(([value,label])=><button key={value} className={filter===value?'selected':''} onClick={()=>setFilter(value)}>{label}</button>)}
   </div>
   <span className="result-count">{sorted.length} tasks</span>
  </section>

  <section className="task-columns">
   <TaskColumn title={filter==='open'?'Open':filter==='overdue'?'Overdue':filter==='today'?'Due today':'Completed'} items={sorted} complete={complete}/>
  </section>

  {show&&<div className="modal-overlay" onClick={()=>setShow(false)}>
   <form className="add-modal module-modal" onSubmit={add} onClick={e=>e.stopPropagation()}>
    <button type="button" className="modal-close" onClick={()=>setShow(false)}><X size={18}/></button>
    <span className="eyebrow">FOLLOW-UP</span>
    <h2>Create a task</h2>
    {error&&<div className="form-error">{error}</div>}
    <div className="modal-form">
     <input placeholder="Task title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
     <select value={form.contactId} onChange={e=>setForm({...form,contactId:e.target.value})}>
      <option value="">No contact</option>
      {contacts.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name||''}</option>)}
     </select>
     <select value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})}>
      <option value="">Assign to me</option>
      {users.map(u=><option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}
     </select>
     <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
     <input type="datetime-local" value={form.dueAt} onChange={e=>setForm({...form,dueAt:e.target.value})}/>
     <button className="add-button">Create task</button>
    </div>
   </form>
  </div>}
 </main>
}

function TaskColumn({title,items,complete}:{title:string,items:Task[],complete:(id:string,c:boolean)=>void}){
 return <section className="task-column">
  <header><h2>{title}</h2><span>{items.length}</span></header>
  {items.map(t=>{
   const overdue=!t.completed_at&&Boolean(t.due_at)&&new Date(t.due_at || '').getTime()<Date.now()
   return <article className={'task-row-card '+(t.completed_at?'done':'')} key={t.id}>
    <button className="circle-check" onClick={()=>complete(t.id,!t.completed_at)}>{t.completed_at&&<Check size={13}/>}</button>
    <div>
     <strong>{t.title}</strong>
     <small>{[t.first_name,t.last_name].filter(Boolean).join(' ')||'General task'}{t.assigned_name?' · '+t.assigned_name:''}{t.due_at?' · '+(overdue?'Overdue · ':'')+new Date(t.due_at || '').toLocaleString():''}</small>
     {t.description&&<p>{t.description}</p>}
    </div>
   </article>
  })}
  {!items.length&&<div className="soft-empty">Nothing here.</div>}
 </section>
}
