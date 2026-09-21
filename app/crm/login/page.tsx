'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const response = await fetch('/api/crm/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    const data = await response.json()
    setLoading(false)
    if (!response.ok) return setError(data.error || 'Unable to sign in')
    router.push('/crm')
    router.refresh()
  }

  return <main className="auth-page"><div className="auth-card"><div className="crm-mark">M</div><span className="eyebrow">MARKET METHOD</span><h1>Sign in</h1><p>Access your customer system.</p><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>{error && <div className="auth-error">{error}</div>}<button className="add-button" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button></form><div className="auth-switch">New to Market Method? <a href="/crm/signup">Create an account</a></div></div></main>
}
