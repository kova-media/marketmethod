'use client'
import {useEffect,useState} from 'react'
import {ChevronLeft} from 'lucide-react'

export default function SettingsPage(){
 const [org,setOrg]=useState<any>(null)
 const [currentUser,setCurrentUser]=useState<any>(null)
 const [users,setUsers]=useState<any[]>([])
 const [stages,setStages]=useState<any[]>([])
 const [invites,setInvites]=useState<any[]>([])
 const [inviteEmail,setInviteEmail]=useState('')
 const [inviteUrl,setInviteUrl]=useState('')
 const [newStage,setNewStage]=useState('')
 const [saved,setSaved]=useState(false)
 const [fields,setFields]=useState<any[]>([])
 const [newField,setNewField]=useState('')
 const [integrations,setIntegrations]=useState<any>({})
 const [messageError,setMessageError]=useState('')

 useEffect(()=>{
  Promise.all([fetch('/api/crm/settings'),fetch('/api/crm/invites'),fetch('/api/crm/custom-fields')]).then(async([a,b,c])=>{
   const [ad,bd,fd]=await Promise.all([a.json(),b.json(),c.json()])
   if(ad.organization){setCurrentUser(ad.currentUser||null);setOrg(ad.organization);setUsers(ad.users||[]);setStages(ad.stages||[]);setIntegrations(ad.integrations||{})}
   if(b.ok)setInvites(bd.invites||[])
   if(c.ok)setFields(fd.fields||[])
  })
 },[])

 const owner=currentUser?.role==='owner'
 async function addStage(){if(!newStage.trim())return;const r=await fetch('/api/crm/stages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newStage})});const d=await r.json();if(r.ok){setStages(p=>[...p,d.stage].sort((a,b)=>a.position-b.position));setNewStage('')}}
 async function addField(){if(!newField.trim())return;const r=await fetch('/api/crm/custom-fields',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newField})});const d=await r.json();if(r.ok){setFields(p=>[...p.filter(x=>x.id!==d.field.id),d.field].sort((a,b)=>a.name.localeCompare(b.name)));setNewField('')}}
 async function removeField(id:string){const r=await fetch('/api/crm/custom-fields?id='+id,{method:'DELETE'});if(r.ok)setFields(p=>p.filter(x=>x.id!==id))}

 async function renameStage(stage:any){const name=String(stage.editName||stage.name).trim();if(!name)return;const r=await fetch('/api/crm/stages',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:stage.id,name,position:stage.position,color:stage.color})});const d=await r.json();if(r.ok)setStages(p=>p.map(x=>x.id===stage.id?{...x,...d.stage,editName:''}:x))}

 async function removeStage(id:string){const r=await fetch('/api/crm/stages',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});if(r.ok)setStages(p=>p.filter(x=>x.id!==id))}

 async function save(){
  setMessageError('')
  const r=await fetch('/api/crm/settings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   name:org.name,industry:org.industry,primaryColor:org.primary_color,logoUrl:org.logo_url,
   senderName:org.sender_name,senderEmail:org.sender_email,replyToEmail:org.reply_to_email,smsFromNumber:org.sms_from_number
  })})
  if(r.ok){const d=await r.json();setOrg(d.organization);setSaved(true);setTimeout(()=>setSaved(false),1800)} else {const d=await r.json();setMessageError(d.error||'Settings could not be saved.')}}


 async function invite(){
  if(!inviteEmail.trim())return
  const r=await fetch('/api/crm/invites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:inviteEmail})})
  const d=await r.json()
  if(r.ok){setInvites(p=>[d.invite,...p]);setInviteUrl(window.location.origin+d.inviteUrl);setInviteEmail('')}
 }

 return <main className="module-page">
  <header className="module-top">
   <div><a href="/crm/dashboard" className="back-link"><ChevronLeft size={15}/> Dashboard</a><span className="eyebrow">WORKSPACE</span><h1>Settings</h1><p>Configure the business this workspace belongs to.</p></div>
   <button className="add-button" onClick={save} disabled={!owner}>{saved?'Saved':'Save changes'}</button>
  </header>
  {messageError&&<div className="form-error">{messageError}</div>}
  {org?<div className="settings-grid">
   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">BUSINESS</span><h3>Workspace details</h3></div></div>
    <div className="settings-form">
     <label>Business name<input disabled={!owner} value={org.name||''} onChange={e=>setOrg({...org,name:e.target.value})}/></label>
     <label>Industry<input disabled={!owner} value={org.industry||''} onChange={e=>setOrg({...org,industry:e.target.value})}/></label>
     <label>Primary color<input disabled={!owner} value={org.primary_color||'#C7ED63'} onChange={e=>setOrg({...org,primary_color:e.target.value})}/></label>
     <label>Logo URL<input disabled={!owner} value={org.logo_url||''} onChange={e=>setOrg({...org,logo_url:e.target.value})}/></label>
    </div>
   </section>

   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">COMMUNICATIONS</span><h3>Message settings</h3></div></div>
    <div className="settings-form">
     <label>Sender name<input disabled={!owner} value={org.sender_name||''} onChange={e=>setOrg({...org,sender_name:e.target.value})} placeholder="Your business name"/></label>
     <label>Sender email<input disabled={!owner} type="email" value={org.sender_email||''} onChange={e=>setOrg({...org,sender_email:e.target.value})} placeholder="hello@yourbusiness.com"/></label>
     <label>Reply-to email<input disabled={!owner} type="email" value={org.reply_to_email||''} onChange={e=>setOrg({...org,reply_to_email:e.target.value})} placeholder="hello@yourbusiness.com"/></label>
     <label>SMS sending number<input disabled={!owner} value={org.sms_from_number||''} onChange={e=>setOrg({...org,sms_from_number:e.target.value})} placeholder="+15551234567"/></label>
     <p className="settings-note">Email uses Resend. SMS uses Twilio. Provider credentials are kept at the deployment level.</p>
    </div>
   </section>

   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">INTEGRATIONS</span><h3>Connection status</h3></div></div>
    <div className="settings-row"><span><strong>Email sending</strong><small>Resend</small></span><em className={integrations.emailSending?'success-text':'error-text'}>{integrations.emailSending?'Ready':'Needs API key'}</em></div>
    <div className="settings-row"><span><strong>Inbound email</strong><small>Resend webhook</small></span><em className={integrations.emailInbound?'success-text':'error-text'}>{integrations.emailInbound?'Ready':'Needs webhook secret'}</em></div>
    <div className="settings-row"><span><strong>SMS sending</strong><small>Twilio</small></span><em className={integrations.smsSending?'success-text':'error-text'}>{integrations.smsSending?'Ready':'Needs Twilio setup'}</em></div>
   </section>

   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">TEAM</span><h3>Users</h3></div><span className="count-badge">{users.length}</span></div>
    {users.map(u=><div className="settings-row" key={u.id}><span className="contact-avatar">{u.name.split(' ').map((x:string)=>x[0]).join('').slice(0,2)}</span><span><strong>{u.name}</strong><small>{u.email}</small></span><em>{u.role}</em></div>)}
   </section>

   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">TEAM INVITES</span><h3>Invite a teammate</h3></div></div>
    <div className="settings-form">
     <label>Email<input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="teammate@business.com"/></label>
     <div className="invite-action"><button className="add-button" onClick={invite} disabled={!owner}>Create invite</button></div>
     {inviteUrl&&<div className="invite-result"><strong>Invite link</strong><input readOnly value={inviteUrl}/><small>Send this link to the teammate. It expires in 7 days.</small></div>}
    </div>
    {invites.slice(0,5).map(i=><div className="settings-row" key={i.id}><span className="stage-number">+</span><span><strong>{i.email}</strong><small>{i.accepted_at?'Accepted':'Pending'} · expires {new Date(i.expires_at).toLocaleDateString()}</small></span><em>{i.role}</em></div>)}
   </section>

   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">CONTACT DATA</span><h3>Custom fields</h3></div><span className="count-badge">{fields.length}</span></div>
    <div className="settings-form stage-add"><input disabled={!owner} value={newField} onChange={e=>setNewField(e.target.value)} placeholder="Field name, e.g. Preferred service" onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addField()}}}/><button className="add-button" onClick={addField} disabled={!owner}>Add field</button></div>
    {fields.map(f=><div className="settings-row" key={f.id}><span className="stage-number">Aa</span><span><strong>{f.name}</strong><small>{f.field_key}</small></span><button className="row-delete" onClick={()=>removeField(f.id)}>Delete</button></div>)}
    {!fields.length&&<div className="soft-empty">No custom fields yet.</div>}
   </section>

   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">PIPELINE</span><h3>Stages</h3></div></div>
    <div className="settings-form stage-add"><input disabled={!owner} value={newStage} onChange={e=>setNewStage(e.target.value)} placeholder="New stage name" onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addStage()}}}/><button className="add-button" onClick={addStage} disabled={!owner}>Add stage</button></div>
    {stages.map(s=><div className="settings-row" key={s.id}><span className="stage-number">{s.position}</span><span className="stage-edit"><input disabled={!owner} value={s.editName??s.name} onChange={e=>setStages(p=>p.map(x=>x.id===s.id?{...x,editName:e.target.value}:x))}/></span><button className="text-action" disabled={!owner} onClick={()=>renameStage(s)}>Save</button><button className="row-delete" disabled={!owner} onClick={()=>removeStage(s.id)}>Delete</button></div>)}
   </section>
  </div>:<div className="empty-module">Loading workspace...</div>}
 </main>
}
