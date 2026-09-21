'use client'
import {FormEvent,useState} from 'react'
import {useParams,useRouter} from 'next/navigation'
export default function ResetPasswordPage(){
 const {token}=useParams<{token:string}>(),router=useRouter()
 const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[error,setError]=useState(''),[saving,setSaving]=useState(false)
 async function submit(e:FormEvent){e.preventDefault();if(password!==confirm){setError('Passwords do not match.');return}setSaving(true);setError('');const r=await fetch('/api/crm/auth/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password})});const d=await r.json();setSaving(false);if(!r.ok){setError(d.error||'Could not reset password');return}router.push('/crm/dashboard')}
 return <main className="auth-shell"><section className="auth-card"><div className="auth-brand"><div className="crm-mark">M</div><div><strong>Market Method</strong><span>Customer System</span></div></div><span className="eyebrow">ACCOUNT ACCESS</span><h1>Choose a new password</h1><p className="auth-subtitle">Use at least 8 characters.</p>{error&&<div className="auth-error">{error}</div>}<form onSubmit={submit} className="auth-form"><label>New password<input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="new-password"/></label><label>Confirm password<input type="password" minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} required autoComplete="new-password"/></label><button className="add-button" disabled={saving}>{saving?'Updating...':'Update password'}</button></form></section></main>
}
