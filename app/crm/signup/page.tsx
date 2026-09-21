'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ businessName:'', name:'', email:'', password:'', industry:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const update=(key:string,value:string)=>setForm(prev=>({...prev,[key]:value}))

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const response = await fetch('/api/crm/auth/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    const data = await response.json()
    setLoading(false)
    if (!response.ok) return setError(data.error || 'Unable to create account')
    router.push('/crm')
    router.refresh()
  }

  return <main className="auth-page"><div className="auth-card wide"><div className="crm-mark">M</div><span className="eyebrow">MARKET METHOD</span><h1>Create your workspace</h1><p>Set up the customer system for your business.</p><form onSubmit={submit}><label>Business name<input value={form.businessName} onChange={e=>update('businessName',e.target.value)} required /></label><label>Your name<input value={form.name} onChange={e=>update('name',e.target.value)} required /></label><label>Email<input type="email" value={form.email} onChange={e=>update('email',e.target.value)} required /></label><label>Password<input type="password" minLength={8} value={form.password} onChange={e=>update('password',e.target.value)} required /><small>At least 8 characters.</small></label><label>Industry <span className="optional">Optional</span><input value={form.industry} onChange={e=>update('industry',e.target.value)} placeholder="Automotive, landscaping, dental..." /></label>{error && <div className="auth-error">{error}</div>}<button className="add-button" disabled={loading}>{loading ? 'Creating workspace...' : 'Create workspace'}</button></form><div className="auth-switch">Already have an account? <a href="/crm/login">Sign in</a></div></div></main>
}
