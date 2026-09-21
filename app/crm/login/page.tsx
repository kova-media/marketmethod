'use client'

import { FormEvent, useState } from 'react'

export default function LoginPage(){
 const [email,setEmail]=useState('')
 const [password,setPassword]=useState('')
 const [error,setError]=useState('')
 const [loading,setLoading]=useState(false)
 async function submit(e:FormEvent){e.preventDefault();setError('');setLoading(true);const r=await fetch('/api/crm/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const d=await r.json();setLoading(false);if(!r.ok){setError(d.error||'Unable to sign in');return}window.location.href='/crm/dashboard'}
 return <main className="auth-page"><section className="auth-card"><div className="auth-brand"><span className="crm-mark">M</span><strong>Market Method</strong></div><span className="eyebrow">CUSTOMER SYSTEM</span><h1>Sign in</h1><p>Access your business workspace and customer records.</p><form className="auth-form" onSubmit={submit}><label>Email address</label><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/><label>Password</label><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/>{error&&<div className="auth-error">{error}</div>}<button className="auth-submit" disabled={loading}>{loading?'Signing in...':'Sign in'}</button></form><p className="auth-switch"><a href="/crm/forgot-password">Forgot your password?</a></p><p className="auth-switch">New to Market Method? <a href="/crm/signup">Create a workspace</a></p></section></main>
}
