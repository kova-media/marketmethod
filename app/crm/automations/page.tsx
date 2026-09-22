'use client'

import {FormEvent,useEffect,useState} from 'react'
import {ChevronLeft,Plus,X} from 'lucide-react'

const triggers=[['contact_created','New contact created'],['status_changed','Pipeline status changes'],['appointment_completed','Appointment completed']]

export default function AutomationsPage(){
 const [items,setItems]=useState<any[]>([]),[events,setEvents]=useState<any[]>([]),[show,setShow]=useState(false)
 const [form,setForm]=useState({
  name:'',
  triggerType:'contact_created',
  actionType:'create_task',
  taskTitle:'Follow up with new contact',
  taskDays:'1',
  emailSubject:'Following up',
  messageBody:'Hi {{contact.first_name}}, just following up.',
  recipient:'{{contact.email}}',
  waitAmount:'1',
  waitUnit:'days',
  delayedAction:'send_email'
 })
 useEffect(()=>{load()},[])
 async function load(){
  const r=await fetch('/api/crm/automations')
  const d=await r.json()
  if(r.ok){setItems(d.automations||[]);setEvents(d.events||[])}
 }
 function actionFrom(type:string){
  if(type==='create_task')return {type:'create_task',title:form.taskTitle,dueDays:Number(form.taskDays)}
  if(type==='send_email')return {type:'send_email',to:form.recipient,subject:form.emailSubject,body:form.messageBody}
  return {type:'send_sms',to:form.recipient,body:form.messageBody}
 }
 function buildActions(){
  if(form.actionType==='wait_then_action'){
   return [
    {type:'wait',[form.waitUnit]:Number(form.waitAmount)},
    actionFrom(form.delayedAction)
   ]
  }
  return [actionFrom(form.actionType)]
 }
 async function add(e:FormEvent){
  e.preventDefault()
  const r=await fetch('/api/crm/automations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   name:form.name,triggerType:form.triggerType,actions:buildActions()
  })})
  const d=await r.json()
  if(r.ok){setItems(p=>[d.automation,...p]);setShow(false)}
 }
 async function toggle(id:string,enabled:boolean){
  const r=await fetch('/api/crm/automations',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,enabled})})
  const d=await r.json()
  if(r.ok)setItems(p=>p.map(x=>x.id===id?d.automation:x))
 }
 return <main className="module-page">
  <header className="module-top">
   <div><a href="/crm/dashboard" className="back-link"><ChevronLeft size={15}/> Dashboard</a><span className="eyebrow">AUTOMATION</span><h1>Automations</h1><p>Turn repeatable follow-up into rules the system can run for you.</p></div>
   <button className="add-button" onClick={()=>setShow(true)}><Plus size={17}/> New automation</button>
  </header>
  <div className="settings-grid">
   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">RULES</span><h3>Active automations</h3></div><span className="count-badge">{items.length}</span></div>
    {items.map(a=><div className="automation-row" key={a.id}><div><strong>{a.name}</strong><small>{triggers.find(x=>x[0]===a.trigger_type)?.[1]||a.trigger_type}</small></div><button className={'toggle '+(a.enabled?'on':'')} onClick={()=>toggle(a.id,!a.enabled)}><i/></button></div>)}
    {!items.length&&<div className="soft-empty">No automation rules yet.</div>}
   </section>
   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">ACTIVITY</span><h3>Recent runs</h3></div></div>
    {events.map(e=><div className="automation-row" key={e.id}><div><strong>{e.automation_name}</strong><small>{e.event_type} · {new Date(e.created_at).toLocaleString()}</small></div><em className={e.status==='failed'?'error-text':'success-text'}>{e.status}</em></div>)}
    {!events.length&&<div className="soft-empty">No automation runs yet.</div>}
   </section>
  </div>
  {show&&<div className="modal-overlay" onClick={()=>setShow(false)}>
   <form className="add-modal module-modal" onSubmit={add} onClick={e=>e.stopPropagation()}>
    <button type="button" className="modal-close" onClick={()=>setShow(false)}><X size={18}/></button>
    <span className="eyebrow">NEW RULE</span><h2>Create automation</h2>
    <div className="modal-form">
     <input placeholder="Automation name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
     <select value={form.triggerType} onChange={e=>setForm({...form,triggerType:e.target.value})}>{triggers.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select>
     <select value={form.actionType} onChange={e=>setForm({...form,actionType:e.target.value})}>
      <option value="create_task">Create task now</option>
      <option value="send_email">Send email now</option>
      <option value="send_sms">Send SMS now</option>
      <option value="wait_then_action">Wait, then take action</option>
     </select>
     {form.actionType==='wait_then_action'&&<>
      <div className="form-grid"><input type="number" min="1" value={form.waitAmount} onChange={e=>setForm({...form,waitAmount:e.target.value})} placeholder="Wait amount"/><select value={form.waitUnit} onChange={e=>setForm({...form,waitUnit:e.target.value})}><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></div>
      <select value={form.delayedAction} onChange={e=>setForm({...form,delayedAction:e.target.value})}><option value="create_task">Create task</option><option value="send_email">Send email</option><option value="send_sms">Send SMS</option></select>
     </>}
     {(form.actionType==='create_task'||form.delayedAction==='create_task'&&form.actionType==='wait_then_action')&&<>
      <input placeholder="Task to create" value={form.taskTitle} onChange={e=>setForm({...form,taskTitle:e.target.value})} required/>
      <input type="number" min="0" placeholder="Days until task is due" value={form.taskDays} onChange={e=>setForm({...form,taskDays:e.target.value})}/>
     </>}
     {(form.actionType==='send_email'||form.actionType==='send_sms'||(form.actionType==='wait_then_action'&&form.delayedAction!=='create_task'))&&<>
      <input placeholder="Recipient" value={form.recipient} onChange={e=>setForm({...form,recipient:e.target.value})}/>
      {(form.actionType==='send_email'||(form.actionType==='wait_then_action'&&form.delayedAction==='send_email'))&&<input placeholder="Email subject" value={form.emailSubject} onChange={e=>setForm({...form,emailSubject:e.target.value})}/>}
      <textarea placeholder="Message" value={form.messageBody} onChange={e=>setForm({...form,messageBody:e.target.value})} required/>
     </>}
     <small className="settings-note">Use {'{{contact.first_name}}'}, {'{{contact.email}}'}, {'{{contact.phone}}'} and {'{{organization.name}}'} in messages. Delayed actions are queued and processed automatically.</small>
     <button className="add-button">Create automation</button>
    </div>
   </form>
  </div>}
 </main>
}
