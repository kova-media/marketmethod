'use client'

import { FormEvent, useState } from 'react'

export default function SignupPage(){
 const [form,setForm]=useState({businessName:'',name:'',email:'',password:'',industry:''})
 const [error,setError]=useState('')
 const [loading,setLoading]=useState(false)

 async function saveBrowserCredential(){
  try{
   const PasswordCredential=(window as any).PasswordCredential
   if(!PasswordCredential) return
   const credential=new PasswordCredential({
    id:form.email,
    password:form.password,
    name:'Market Method',
   })
   if('credentials' in navigator && navigator.credentials?.store){
    await navigator.credentials.store(credential)
   }
  }catch{
   // Browser password saving is optional and should never block account creation.
  }
 }

 async function submit(e:FormEvent){
  e.preventDefault()
  setError('')
  setLoading(true)

  try{
   const r=await fetch('/api/crm/auth/signup',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(form)
   })
   const d=await r.json()

   if(!r.ok){
    setLoading(false)
    setError(d.error||'Unable to create workspace')
    return
   }

   await saveBrowserCredential()
   window.location.href='/crm/dashboard'
  }catch{
   setLoading(false)
   setError('Unable to create workspace. Please try again.')
  }
 }

 return <main className="auth-page">
  <section className="auth-card">
   <div className="auth-brand"><span className="crm-mark">M</span><strong>Market Method</strong></div>
   <span className="eyebrow">NEW WORKSPACE</span>
   <h1>Create your workspace</h1>
   <p>Set up the business account that will own your contacts, pipeline, conversations, tasks, and customer history.</p>
   <form className="auth-form" onSubmit={submit} autoComplete="on">
    <div className="auth-grid">
     <div><label htmlFor="signup-business">Business name</label><input id="signup-business" name="organization" value={form.businessName} onChange={e=>setForm({...form,businessName:e.target.value})} required/></div>
     <div><label htmlFor="signup-name">Your name</label><input id="signup-name" name="name" autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
    </div>
    <label htmlFor="signup-email">Email address</label>
    <input id="signup-email" name="username" type="email" autoComplete="username" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
    <label htmlFor="signup-password">Password</label>
    <input id="signup-password" name="new-password" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
    <label htmlFor="signup-industry">Industry</label>
    <select id="signup-industry" name="industry" value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})}>
     <option value="">Choose an industry</option>
     <option>Automotive</option>
     <option>Cleaning</option>
     <option>Landscaping</option>
     <option>Home Services</option>
     <option>Professional Services</option>
     <option>Other</option>
    </select>
    {error&&<div className="auth-error">{error}</div>}
    <button className="auth-submit" disabled={loading}>{loading?'Creating workspace...':'Create workspace'}</button>
   </form>
   <p className="auth-switch">Already have a workspace? <a href="/crm/login">Sign in</a></p>
  </section>
 </main>
}
