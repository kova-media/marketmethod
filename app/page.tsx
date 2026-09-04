'use client'

import { FormEvent, useState } from 'react'

const systems = [
  ['Website', 'A clear first impression that gives people a reason to contact you.'],
  ['Lead capture', 'Make it easy to ask for a quote, call, or request service.'],
  ['Scheduling', 'Give ready-to-buy customers a simple way to book.'],
  ['Lead follow-up', 'Follow up when someone asks but does not book.'],
  ['Customer reactivation', 'Give past customers a reason to come back.'],
  ['Review requests', 'Ask satisfied customers for a Google review.'],
  ['Attribution', 'See where inquiries come from and what happens next.'],
  ['Revenue tracking', 'Connect leads and bookings to the work they create.'],
]

const industries = [
  'Home services',
  'Professional services',
  'Health & wellness',
  'Automotive',
  'Local specialty businesses',
]

const faqs = [
  ['Is Market Method a marketing agency?', 'Not in the traditional sense. We focus on what happens after someone finds your business: contacting you, getting a response, booking, returning, and becoming revenue.'],
  ['Do I have to pay for a new website upfront?', 'Not necessarily. Depending on the business and opportunity, an engagement can be structured with little or no upfront cost and compensation tied to results.'],
  ['What kinds of businesses do you work with?', 'Local service businesses where a qualified lead can become a meaningful revenue event. That includes home services, professional services, health and wellness, automotive, and specialty businesses.'],
  ['How do you measure results?', 'We start with the inquiry and follow the customer journey through booking and, where the data is available, the completed job and resulting revenue.'],
]

function LeadModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setError('')

    const form = event.currentTarget
    const data = new FormData(form)

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error || 'Something went wrong. Please try again.')
      }

      setStatus('success')
      form.reset()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">Close</button>
        {status === 'success' ? (
          <div className="form-success">
            <h2>We got it.</h2>
            <p>Your information has been sent. We will be in touch.</p>
            <button className="button button-dark" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h2>Let&apos;s look at where the money is getting lost.</h2>
            <p className="modal-intro">Tell us about the business and what happens when a customer reaches out.</p>
            <form onSubmit={submitLead}>
              <input required name="name" placeholder="Your name" aria-label="Your name" />
              <input required name="email" type="email" placeholder="Email address" aria-label="Email address" />
              <input required name="businessName" placeholder="Business name" aria-label="Business name" />
              <input name="website" placeholder="Website URL" aria-label="Website URL" />
              <textarea name="message" placeholder="What would you like to improve?" rows={4} aria-label="What would you like to improve?" />
              <button className="button button-dark" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending...' : 'Request a look'}
              </button>
              {status === 'error' && <p className="form-error">{error}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const [modal, setModal] = useState(false)
  const [open, setOpen] = useState<number | null>(null)

  return (
    <main>
      <nav className="nav wrap" aria-label="Main navigation">
        <a href="#top" className="brand" aria-label="Market Method home"><img src="/logo.svg" alt="Market Method" /></a>
        <div className="nav-links">
          <a href="#system">The system</a>
          <a href="#process">How it works</a>
          <a href="#fit">Who it&apos;s for</a>
        </div>
        <button className="button nav-cta" onClick={() => setModal(true)}>Apply to work with us</button>
      </nav>

      <section className="hero wrap" id="top">
        <div className="hero-copy">
          <h1>Turn more inquiries into booked jobs.</h1>
          <p className="hero-sub">Market Method builds and operates the system between a customer finding your business and paying you.</p>
          <div className="hero-actions">
            <button className="button" onClick={() => document.getElementById('system')?.scrollIntoView({ behavior: 'smooth' })}>See the system</button>
            <button className="text-button" onClick={() => setModal(true)}>Apply to work with us</button>
          </div>
        </div>
        <div className="hero-proof">
          <p className="hero-proof-title">The gap we work on</p>
          <div className="hero-proof-flow">
            <span>Customer finds you</span>
            <span>They reach out</span>
            <span>They book</span>
            <span>You get the job</span>
          </div>
          <p className="hero-proof-note">Most businesses spend money getting the first step right. We focus on everything that happens after it.</p>
        </div>
      </section>

      <section className="statement">
        <div className="wrap statement-inner">
          <div className="statement-main">
            <h2>Getting found is only the beginning.</h2>
            <p>We work on what happens after the lead arrives.</p>
          </div>
          <div className="statement-points">
            <div><h3>Respond</h3><p>Make sure the inquiry gets a fast, useful response.</p></div>
            <div><h3>Book</h3><p>Make the next step simple enough to complete.</p></div>
            <div><h3>Return</h3><p>Bring past customers back when there is another job to do.</p></div>
          </div>
        </div>
      </section>

      <section className="system wrap" id="system">
        <div className="section-head">
          <div><h2>Everything between<br /><em>the lead and the job.</em></h2></div>
          <p>We build the parts of the customer journey that determine whether demand turns into work.</p>
        </div>
        <div className="system-list">
          {systems.map(([title, description]) => (
            <article className="system-item" key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="journey">
        <div className="wrap journey-inner">
          <div className="journey-copy">
            <h2>Find. Contact. Book. Return.</h2>
            <p>Most lost revenue is not lost at the first click. It is lost in the steps that follow.</p>
          </div>
          <div className="journey-path" aria-label="Customer journey from discovery to revenue">
            <div><strong>Find</strong><span>Someone discovers the business.</span></div>
            <div><strong>Contact</strong><span>They call, submit a request, or start a conversation.</span></div>
            <div><strong>Decide</strong><span>They get a response, quote, or booking option.</span></div>
            <div><strong>Book</strong><span>The opportunity becomes scheduled work.</span></div>
            <div><strong>Return</strong><span>The customer has a reason to come back.</span></div>
          </div>
        </div>
      </section>

      <section className="process wrap" id="process">
        <div className="process-intro"><h2>We find the weak points, then build around them.</h2></div>
        <div className="process-list">
          <article className="process-row"><h3>Find the leaks</h3><p>We look at what happens when someone finds you and where opportunities disappear.</p></article>
          <article className="process-row"><h3>Build the system</h3><p>We build the website and infrastructure around the gaps that matter most.</p></article>
          <article className="process-row"><h3>Operate it</h3><p>Follow-up, booking, review requests, reactivation, and measurement become part of the system.</p></article>
          <article className="process-row"><h3>Measure revenue</h3><p>We follow the path from inquiry to booked work and, where possible, the revenue it creates.</p></article>
        </div>
      </section>

      <section className="risk">
        <div className="wrap risk-grid">
          <div><h2>Our incentives should look more like yours.</h2></div>
          <div>
            <p className="risk-big">We can put more of our compensation at risk.</p>
            <p className="muted">Depending on the business, that can mean little or no upfront cost, with Market Method participating in the upside when the system produces additional revenue.</p>
          </div>
        </div>
      </section>

      <section className="fit wrap" id="fit">
        <div className="section-head fit-head">
          <div><h2>Local businesses where a new customer is worth something.</h2></div>
          <p>We are intentionally not limited to one trade. The model works anywhere the customer journey can be improved and the resulting work can be measured.</p>
        </div>
        <div className="industry-list">
          {industries.map((industry) => <div key={industry}><h3>{industry}</h3></div>)}
        </div>
      </section>

      <section className="faq wrap">
        <div><h2>Before we talk numbers.</h2></div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
            <div className="faq-row" key={question}>
              <button onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index}>
                <span>{question}</span><span className="faq-mark">{open === index ? '−' : '+'}</span>
              </button>
              {open === index && <p>{answer}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <div className="wrap cta-inner">
          <h2>Let&apos;s see where the next job is getting lost.</h2>
          <button className="button" onClick={() => setModal(true)}>Apply to work with us</button>
        </div>
      </section>

      <footer className="footer wrap">
        <a href="#top" className="brand footer-brand" aria-label="Market Method home"><img src="/logo.svg" alt="Market Method" /></a>
        <p>Revenue infrastructure for local service businesses.</p>
        <p>© 2026 Market Method</p>
      </footer>

      {modal && <LeadModal onClose={() => setModal(false)} />}
    </main>
  )
}
