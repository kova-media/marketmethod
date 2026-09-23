'use client'
import {useEffect,useMemo,useState} from 'react'
import {ChevronLeft,Plus,Search} from 'lucide-react'

export default function PipelinePage(){
 const [stages,setStages]=useState<any[]>([]),[contacts,setContacts]=useState<any[]>([]),[query,setQuery]=useState('')
 useEffect(()=>{fetch('/api/crm/pipeline').then(r=>r.json()).then(d=>{setStages(d.stages||[]);setContacts(d.contacts||[])})},[])
 async function move(id:string,status:string){
  const r=await fetch('/api/crm/pipeline',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({contactId:id,status})})
  if(r.ok)setContacts(p=>p.map(c=>c.id===id?{...c,status}:c))
 }
 const cols=stages.length?stages.map(s=>({...s,key:String(s.name).toLowerCase()})):[{id:'new',name:'New',key:'new'},{id:'contacted',name:'Contacted',key:'contacted'},{id:'qualified',name:'Qualified',key:'qualified'},{id:'won',name:'Won',key:'won'}]
 const filtered=useMemo(()=>{
  const q=query.trim().toLowerCase()
  if(!q)return contacts
  return contacts.filter(c=>[c.first_name,c.last_name,c.email,c.company].filter(Boolean).join(' ').toLowerCase().includes(q))
 },[contacts,query])
 return <main className="module-page">
  <header className="module-top"><div><a href="/crm/dashboard" className="back-link"><ChevronLeft size={15}/> Dashboard</a><span className="eyebrow">SALES PIPELINE</span><h1>Pipeline</h1><p>Move leads forward as conversations happen.</p></div><a className="add-button" href="/crm/contacts"><Plus size={17}/> Add contact</a></header>
  <section className="module-toolbar"><label className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search pipeline..."/></label><span className="result-count">{filtered.length} contacts</span></section>
  <div className="kanban">{cols.map(s=>{
   const inStage=filtered.filter(c=>String(c.status||'new').toLowerCase()===s.key)
   return <section className="kanban-col" key={s.id}><header><div><strong>{s.name}</strong><small>{inStage.length} contacts</small></div></header><div className="kanban-cards">
    {inStage.map(c=><article className="kanban-card" key={c.id}><a href="/crm/contacts"><strong>{c.first_name} {c.last_name||''}</strong><small>{c.company||c.email||'No details'}</small></a><select value={c.status||'new'} onChange={e=>move(c.id,e.target.value)}>{cols.map(x=><option key={x.id} value={x.key}>{x.name}</option>)}</select></article>)}
    {!inStage.length&&<div className="kanban-empty">No contacts</div>}
   </div></section>
  })}</div>
 </main>
}
