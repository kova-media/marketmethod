'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, MessageSquare, Plus, Send, X } from 'lucide-react'

export default function ConversationsPage(){
 const [items,setItems]=useState<any[]>([])
 const [contacts,setContacts]=useState<any[]>([])
 const [selected,setSelected]=useState<any>(null)
 const [messages,setMessages]=useState<any[]>([])
 const [body,setBody]=useState('')
 const [show,setShow]=useState(false)
 const [newContact,setNewContact]=useState('')
 const [channel,setChannel]=useState('sms')
 async function load(){const [cr,ct]=await Promise.all([fetch('/api/crm/conversations'),fetch('/api/crm/contacts')]);const cd=await cr.json();const td=await ct.json();if(cr.ok)setItems(cd.conversations||[]);if(ct.ok)setContacts(td.contacts||[])}
 useEffect(()=>{load()},[])
 async function open(c:any){setSelected(c);const r=await fetch('/api/crm/conversations/'+c.id);const d=await r.json();if(r.ok)setMessages(d.messages||[])}
 async function create(){if(!newContact)return;const r=await fetch('/api/crm/conversations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contactId:newContact,channel})});const d=await r.json();if(r.ok){setShow(false);await load();if(d.conversation?.id){const found={...d.conversation,contact_id:newContact};setSelected(found);open(found)}}}
 async function send(){if(!body.trim()||!selected)return;const r=await fetch('/api/crm/conversations/'+selected.id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({body})});const d=await r.json();if(r.ok){setMessages(p=>[...p,d.message]);setBody('')}}
 return <main className="module-page">
  <header className="module-top"><div><a href="/crm/dashboard" className="back-link"><ChevronLeft size={15}/> Dashboard</a><span className="eyebrow">CUSTOMER COMMUNICATION</span><h1>Conversations</h1><p>Keep customer messages attached to the customer record.</p></div><button className="add-button" onClick={()=>setShow(true)}><Plus size={17}/> Start conversation</button></header>
  <div className="conversation-layout"><aside className="conversation-list">{items.map(c=><button key={c.id} className={selected?.id===c.id?'selected':''} onClick={()=>open(c)}><span className="contact-avatar">{[c.first_name,c.last_name].filter(Boolean).map(x=>x[0]).join('').toUpperCase()}</span><span><strong>{c.first_name} {c.last_name||''}</strong><small>{c.channel.toUpperCase()} · {c.status}</small></span></button>)}{!items.length&&<div className="soft-empty">No conversations yet.</div>}</aside><section className="conversation-main">{selected?<><header><div><span className="eyebrow">{selected.channel.toUpperCase()}</span><h2>{selected.first_name} {selected.last_name||''}</h2></div></header><div className="message-list">{messages.map(m=><div className={'message-bubble '+m.direction} key={m.id}>{m.body}<small>{new Date(m.sent_at).toLocaleString()}</small></div>)}{!messages.length&&<div className="soft-empty">No messages yet. This is the conversation record where SMS/email integrations will connect.</div>}</div><div className="message-compose"><textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Write a message..."/><button onClick={send}><Send size={16}/></button></div></>:<div className="conversation-empty"><MessageSquare size={30}/><h2>Select a conversation</h2><p>Messages, replies, and customer context will live here.</p></div>}</section></div>
  {show&&<div className="modal-overlay" onClick={()=>setShow(false)}><div className="add-modal module-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShow(false)}><X size={18}/></button><span className="eyebrow">NEW CONVERSATION</span><h2>Start a conversation</h2><div className="modal-form"><select value={newContact} onChange={e=>setNewContact(e.target.value)}><option value="">Choose contact</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name||''}</option>)}</select><select value={channel} onChange={e=>setChannel(e.target.value)}><option value="sms">SMS</option><option value="email">Email</option></select><button className="add-button" onClick={create}>Create conversation</button></div></div></div>}
 </main>
}
