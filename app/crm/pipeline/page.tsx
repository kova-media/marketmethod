'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'

const fallback=['New','Contacted','Qualified','Won']

export default function PipelinePage(){
 const [stages,setStages]=useState<any[]>([])
 const [contacts,setContacts]=useState<any[]>([])
 const [loading,setLoading]=useState(true)

 async function load(){const r=await fetch('/api/crm/pipeline');const d=await r.json();if(r.ok){setStages(d.stages||[]);setContacts(d.contacts||[])}setLoading(false)}
 useEffect(()=>{load()},[])

 async function move(id:string,status:string){
   const r=await fetch('/api/crm/pipeline',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({contactId:id,status})})
   if(r.ok) setContacts(p=>p.map(c=>c.id===id?{...c,status}:c))
 }

 const cols=stages.length?stages:fallback.map((name,i)=>({id:name,name,position:i}))
 return <main className="module-page">
  <header className="module-top"><div><a href="/crm/dashboard" className="back-link"><ChevronLeft size={15}/> Dashboard</a><span className="eyebrow">SALES PIPELINE</span><h1>Pipeline</h1><p>Move leads forward as conversations happen.</p></div><a className="add-button" href="/crm/contacts"><Plus size={17}/> Add contact</a></header>
  {loading?<div className="empty-module"><p>Loading pipeline...</p></div>:<div className="kanban">{cols.map((stage:any)=><section className="kanban-col" key={stage.id}><header><div><strong>{stage.name}</strong><small>{contacts.filter(c=>(c.status||'new').toLowerCase()===stage.name.toLowerCase()).length} contacts</small></div></header><div className="kanban-cards">{contacts.filter(c=>(c.status||'new').toLowerCase()===stage.name.toLowerCase()).map(c=><article className="kanban-card" key={c.id}><a href={'/crm/contacts#'+c.id}><strong>{c.first_name} {c.last_name||''}</strong><small>{c.company||c.email||'No company'}</small></a><select value={c.status||'new'} onChange={e=>move(c.id,e.target.value)}>{cols.map((s:any)=><option key={s.id} value={String(s.name).toLowerCase()}>{s.name}</option>)}</select></article>)}{!contacts.filter(c=>(c.status||'new').toLowerCase()===stage.name.toLowerCase()).length&&<div className="kanban-empty">No contacts</div>}</div></section>)}</div>}
 </main>
}
