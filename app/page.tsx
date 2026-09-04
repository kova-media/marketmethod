'use client'

import { FormEvent, useState } from 'react'

const faqs = [
  ['Is Market Method a web design company?', 'No. The website is one part of a larger customer acquisition, follow-up, and retention system.'],
  ['Do you replace our existing software?', 'Not necessarily. We start with what the business already uses and determine what should connect, change, or be added.'],
  ['What happens after I submit a request?', 'We review the business, identify where customers are being lost, and determine what should be built first.'],
]
const improvementOptions = ['Capture more leads','Follow up with leads','Get more repeat customers','Automate customer communication','Improve the website','Organize customer information']

function LeadModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<'idle'|'sending'|'success'|'error'>('idle')
  const [error, setError] = useState('')
  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus('sending'); setError('')
    const form = event.currentTarget, data = new FormData(form)
    const payload = { name:String(data.get('name')||''), email:String(data.get('email')||''), phone:String(data.get('phone')||''), businessName:String(data.get('businessName')||''), website:String(data.get('website')||''), improvements:data.getAll('improvements').join(', '), message:String(data.get('message')||''), company:String(data.get('company')||'') }
    try {
      const response = await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      if (!response.ok) { const result=await response.json().catch(()=>null); throw new Error(result?.error||'Something went wrong. Please try again.') }
      setStatus('success'); form.reset()
    } catch (err) { setStatus('error'); setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.') }
  }
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}>
    <button className="close" onClick={onClose} aria-label="Close">Close</button>
    {status==='success' ? <div className="form-success"><p className="form-kicker">REQUEST RECEIVED</p><h2>We got it.</h2><p>Your information has been sent. We will review what you shared and be in touch.</p><button className="button" onClick={onClose}>Done</button></div> : <>
      <p className="form-kicker">GET STARTED</p><h2>Let&apos;s build a better customer system.</h2><p className="modal-intro">Tell us a little about the business and where you want to improve. We&apos;ll take it from there.</p>
      <form onSubmit={submitLead}>
        <div className="form-grid"><input required name="name" placeholder="Your name *" aria-label="Your name" autoComplete="name"/><input required name="email" type="email" placeholder="Email address *" aria-label="Email address" autoComplete="email"/></div>
        <div className="form-grid"><input required name="phone" type="tel" placeholder="Phone number *" aria-label="Phone number" autoComplete="tel"/><input required name="businessName" placeholder="Business name *" aria-label="Business name" autoComplete="organization"/></div>
        <input name="website" placeholder="Website URL" aria-label="Website URL" autoComplete="url"/>
        <fieldset className="improvement-fieldset"><legend>What would you like to improve?</legend><div className="improvement-grid">{improvementOptions.map(option=><label key={option} className="check-option"><input type="checkbox" name="improvements" value={option}/><span>{option}</span></label>)}</div></fieldset>
        <textarea name="message" placeholder="Anything else we should know?" rows={3} aria-label="Anything else we should know?"/><input className="honeypot" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
        <button className="button form-submit" type="submit" disabled={status==='sending'}>{status==='sending'?'Sending...':'Get Started'}</button><p className="form-note">No commitment required to submit a request.</p>{status==='error'&&<p className="form-error">{error}</p>}
      </form>
    </>}
  </div></div>
}

function DashboardPreview() {
  const rows=[['New leads','8','Today'],['Follow-ups due','14','This week'],['Appointments','23','Upcoming'],['Customers','31','This month']]
  return <div className="dashboard-preview"><div className="dashboard-top"><span>MARKET METHOD</span><strong>CUSTOMER SYSTEM</strong></div><div className="dashboard-grid">{rows.map(([label,value,note])=><div className="dashboard-card" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div><div className="dashboard-activity"><span>WHAT NEEDS ATTENTION</span><div><strong>Quote request</strong><small>Follow up · 12 min ago</small></div><div><strong>Past customer</strong><small>Re-engage · 3 days ago</small></div><div><strong>Service customer</strong><small>Reminder due · Tomorrow</small></div></div></div>
}

export default function Home() {
  const [modal,setModal]=useState(false), [open,setOpen]=useState<number|null>(null)
  return <main>
    <nav className="nav wrap" aria-label="Main navigation"><a href="#top" className="brand" aria-label="Market Method home"><img src="/logo.png" alt="Market Method"/></a><div className="nav-links"><a href="#system">The system</a><a href="#owner">The owner view</a><a href="#questions">Questions</a></div><button className="button nav-cta" onClick={()=>setModal(true)}>Get Started</button></nav>
    <section className="hero wrap" id="top"><div className="hero-copy"><p className="eyebrow">FOR LOCAL BUSINESSES</p><h1>Turn interest into business.<br/>Turn customers into repeat business.</h1><div className="hero-bottom"><p className="hero-sub">Market Method connects the website, lead follow-up, customer records, and retention that keep a customer relationship moving.</p><div className="hero-actions"><button className="button" onClick={()=>setModal(true)}>Get Started</button></div></div></div></section>
    <section className="system-section" id="system"><div className="wrap"><div className="system-heading"><div><p className="eyebrow">THE CUSTOMER JOURNEY</p><h2>Keep the customer moving.</h2></div><p>Market Method connects the moments between finding you, getting in touch, doing business, and coming back.</p></div><div className="journey">
      <article><span>1</span><strong>Find you</strong><p>Your website gives the right customer a reason to reach out.</p></article><article><span>2</span><strong>Reach out</strong><p>The inquiry goes into the customer system.</p></article><article><span>3</span><strong>Follow through</strong><p>Follow-up continues when the customer is not ready yet.</p></article><article><span>4</span><strong>Do business</strong><p>The customer has a clear path to book or buy.</p></article><article><span>5</span><strong>Come back</strong><p>Reminders and reactivation give customers a reason to return.</p></article>
    </div></div></section>
    <section className="owner-section section-stone" id="owner"><div className="wrap owner-grid"><div className="owner-copy"><p className="eyebrow">THE OWNER VIEW</p><h2>You should not have to remember who needs a call.</h2><p>Market Method puts the customer work that normally lives in your head, inbox, spreadsheet, and calendar into one place.</p><div className="automation-list"><div><strong>Lead comes in</strong><span>Customer record created</span></div><div><strong>Lead goes quiet</strong><span>Follow-up is triggered</span></div><div><strong>Service is complete</strong><span>Check-in is scheduled</span></div><div><strong>Customer goes quiet</strong><span>Reactivation can begin</span></div></div></div><DashboardPreview/></div></section>
    <section className="proof-section wrap"><div className="proof-intro"><p className="eyebrow">WHAT YOU GET</p><h2>One system for getting and keeping customers.</h2></div><div className="proof-grid"><div><strong>Website</strong><p>A better front door for the business.</p></div><div><strong>Customer system</strong><p>One place for leads, customers, conversations, and next steps.</p></div><div><strong>Automation</strong><p>Routine follow-up and retention without another task on your list.</p></div></div></section>
    <section className="questions-section" id="questions"><div className="wrap questions-grid"><div><p className="eyebrow">QUESTIONS</p><h2>Before you get started.</h2></div><div className="faq-list">{faqs.map(([question,answer],index)=><div className="faq-row" key={question}><button onClick={()=>setOpen(open===index?null:index)} aria-expanded={open===index}><span>{question}</span><span className="faq-mark">{open===index?'−':'+'}</span></button>{open===index&&<p>{answer}</p>}</div>)}</div></div></section>
    <section className="cta"><div className="wrap cta-inner"><h2>Stop losing customers between the cracks.</h2><p>Tell us where the customer journey breaks down. We&apos;ll start there.</p><button className="button" onClick={()=>setModal(true)}>Get Started</button></div></section>
    <footer className="footer wrap"><a href="#top" className="brand footer-brand" aria-label="Market Method home"><img src="/logo.png" alt="Market Method"/></a><p>© 2026 Market Method, a division of Kova Media Group</p></footer>
    {modal&&<LeadModal onClose={()=>setModal(false)}/>} 
  </main>
}
