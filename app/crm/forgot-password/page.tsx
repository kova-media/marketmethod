'use client'
import {FormEvent,useState} from 'react'
import Link from 'next/link'
export default function ForgotPasswordPage(){
 const [email,setEmail]=useState(''),[sent,setSent]=useState(false),[error,setError]=useState('')
 async function submit(e:FormEvent){e.preventDefault();setError('');const r=await fetch('/api/crm/auth/forgot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});const d=await r.json();if(!r.ok){setError(d.error||'Could not process request');return}setSent(true)}
 return <main className="auth-shell"><section className="auth-card"><div className="auth-brand"><div className="crm-mark">M</div><div><strong>Market Method</strong><span>Customer System</span></div></div><span className="eyebrow">ACCOUNT ACCESS</span><h1>Reset your password</h1>{sent?<><p className="auth-subtitle">If an account exists for that email, a reset link has been sent.</p><Link className="add-button auth-link-button" href="/crm/login">Return to sign in</Link></>:<><p className="auth-subtitle">Enter the email on your account.</p>{error&&<div className="auth-error">{error}</div>}<form onSubmit={submit} className="auth-form"><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label><button className="add-button">Send reset link</button></form><p className="auth-foot"><Link href="/crm/login">Back to sign in</Link></p></>}</section></main>
}
