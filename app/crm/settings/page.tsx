'use client'
import {useEffect,useState} from 'react'
import {ChevronLeft} from 'lucide-react'

export default function SettingsPage(){
 const [org,setOrg]=useState<any>(null)
 const [users,setUsers]=useState<any[]>([])
 const [stages,setStages]=useState<any[]>([])
 const [invites,setInvites]=useState<any[]>([])
 const [inviteEmail,setInviteEmail]=useState('')
 const [inviteUrl,setInviteUrl]=useState('')
 const [saved,setSaved]=useState(false)

 useEffect(()=>{
  Promise.all([fetch('/api/crm/settings'),fetch('/api/crm/invites')]).then(async([a,b])=>{
   const [ad,bd]=await Promise.all([a.json(),b.json()])
   if(ad.organization){setOrg(ad.organization);setUsers(ad.users||[]);setStages(ad.stages||[])}
   if(b.ok)setInvites(bd.invites||[])
  })
 },[])

 async function save(){
  const r=await fetch('/api/crm/settings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   name:org.name,industry:org.industry,primaryColor:org.primary_color,logoUrl:org.logo_url,
   senderName:org.sender_name,senderEmail:org.sender_email,replyToEmail:org.reply_to_email,smsFromNumber:org.sms_from_number
  })})
  if(r.ok){const d=await r.json();setOrg(d.organization);setSaved(true);setTimeout(()=>setSaved(false),1800)}
 }

 async function invite(){
  if(!inviteEmail.trim())return
  const r=await fetch('/api/crm/invites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:inviteEmail})})
  const d=await r.json()
  if(r.ok){setInvites(p=>[d.invite,...p]);setInviteUrl(window.location.origin+d.inviteUrl);setInviteEmail('')}
 }

 return <main className="module-page">
  <header className="module-top">
   <div><a href="/crm/dashboard" className="back-link"><ChevronLeft size={15}/> Dashboard</a><span className="eyebrow">WORKSPACE</span><h1>Settings</h1><p>Configure the business this workspace belongs to.</p></div>
   <button className="add-button" onClick={save}>{saved?'Saved':'Save changes'}</button>
  </header>
  {org?<div className="settings-grid">
   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">BUSINESS</span><h3>Workspace details</h3></div></div>
    <div className="settings-form">
     <label>Business name<input value={org.name||''} onChange={e=>setOrg({...org,name:e.target.value})}/></label>
     <label>Industry<input value={org.industry||''} onChange={e=>setOrg({...org,industry:e.target.value})}/></label>
     <label>Primary color<input value={org.primary_color||'#C7ED63'} onChange={e=>setOrg({...org,primary_color:e.target.value})}/></label>
     <label>Logo URL<input value={org.logo_url||''} onChange={e=>setOrg({...org,logo_url:e.target.value})}/></label>
    </div>
   </section>

   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">COMMUNICATIONS</span><h3>Message settings</h3></div></div>
    <div className="settings-form">
     <label>Sender name<input value={org.sender_name||''} onChange={e=>setOrg({...org,sender_name:e.target.value})} placeholder="Your business name"/></label>
     <label>Sender email<input type="email" value={org.sender_email||''} onChange={e=>setOrg({...org,sender_email:e.target.value})} placeholder="hello@yourbusiness.com"/></label>
     <label>Reply-to email<input type="email" value={org.reply_to_email||''} onChange={e=>setOrg({...org,reply_to_email:e.target.value})} placeholder="hello@yourbusiness.com"/></label>
     <label>SMS sending number<input value={org.sms_from_number||''} onChange={e=>setOrg({...org,sms_from_number:e.target.value})} placeholder="+15551234567"/></label>
     <p className="settings-note">Email uses Resend. SMS uses Twilio. Provider credentials are kept at the deployment level.</p>
    </div>
   </section>

   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">TEAM</span><h3>Users</h3></div><span className="count-badge">{users.length}</span></div>
    {users.map(u=><div className="settings-row" key={u.id}><span className="contact-avatar">{u.name.split(' ').map((x:string)=>x[0]).join('').slice(0,2)}</span><span><strong>{u.name}</strong><small>{u.email}</small></span><em>{u.role}</em></div>)}
   </section>

   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">TEAM INVITES</span><h3>Invite a teammate</h3></div></div>
    <div className="settings-form">
     <label>Email<input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="teammate@business.com"/></label>
     <div className="invite-action"><button className="add-button" onClick={invite}>Create invite</button></div>
     {inviteUrl&&<div className="invite-result"><strong>Invite link</strong><input readOnly value={inviteUrl}/><small>Send this link to the teammate. It expires in 7 days.</small></div>}
    </div>
    {invites.slice(0,5).map(i=><div className="settings-row" key={i.id}><span className="stage-number">+</span><span><strong>{i.email}</strong><small>{i.accepted_at?'Accepted':'Pending'} · expires {new Date(i.expires_at).toLocaleDateString()}</small></span><em>{i.role}</em></div>)}
   </section>

   <section className="panel settings-panel">
    <div className="panel-head"><div><span className="eyebrow">PIPELINE</span><h3>Stages</h3></div></div>
    {stages.map(s=><div className="settings-row" key={s.id}><span className="stage-number">{s.position}</span><span><strong>{s.name}</strong></span><em>Active</em></div>)}
   </section>
  </div>:<div className="empty-module">Loading workspace...</div>}
 </main>
}
