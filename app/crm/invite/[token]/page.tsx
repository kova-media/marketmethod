'use client'
import {FormEvent,useEffect,useState} from 'react'
import {useParams,useRouter} from 'next/navigation'
export default function InvitePage(){
 const params=useParams<{token:string}>(),router=useRouter()
 const [invite,setInvite]=useState<any>(null),[name,setName]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false)
 useEffect(()=>{fetch('/api/crm/invites/'+params.token).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Invite is invalid');setInvite(d.invite)}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[params.token])
 async function submit(e:FormEvent){e.preventDefault();setSaving(true);setError('');const r=await fetch('/api/crm/invites/'+params.token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,password})});const d=await r.json();setSaving(false);if(!r.ok){setError(d.error||'Could not accept invite');return}router.push('/crm/dashboard')}
 if(loading)return <main className="auth-shell"><section className="auth-card"><p>Loading invitation...</p></section></main>
 return <main className="auth-shell"><section className="auth-card"><div className="auth-brand"><div className="crm-mark">M</div><div><strong>Market Method</strong><span>Customer System</span></div></div>{error&&!invite?<div className="auth-error">{error}</div>:invite&&<><span className="eyebrow">WORKSPACE INVITATION</span><h1>Join {invite.organization_name}</h1><p className="auth-subtitle">Create your login for this workspace.</p>{error&&<div className="auth-error">{error}</div>}<form onSubmit={submit} className="auth-form"><label>Name<input value={name} onChange={e=>setName(e.target.value)} required autoComplete="name"/></label><label>Email<input value={invite.email} readOnly/></label><label>Password<input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="new-password"/></label><button className="add-button" disabled={saving}>{saving?'Creating account...':'Join workspace'}</button></form></>}</section></main>
}
