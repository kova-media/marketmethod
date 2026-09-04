'use client'

import { FormEvent, useState } from 'react'

const faqs = [
  ['Is Market Method a web design company?', 'No. The website is one part of a larger customer acquisition, follow-up, and retention system. It is the front door to the system, not the whole product.'],
  ['What does the system include?', 'Market Method connects your website, CRM, lead follow-up, customer retention, and customer communication into one operating system for the business.'],
  ['Do you replace our existing software?', 'Not necessarily. We start with what the business already uses and determine what needs to connect, change, or be added.'],
  ['Is the automated customer service live today?', 'It is an evolving capability. We are building toward automated phone and email support for routine questions, information collection, and booking, with more complicated situations handed to a real person.'],
]

const improvementOptions = [
  'Capture more leads',
  'Follow up with leads',
  'Get more repeat customers',
  'Automate customer communication',
  'Improve the website',
  'Organize customer information',
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
    const selectedImprovements = data.getAll('improvements')
    const payload = {
      name: String(data.get('name') || ''),
      email: String(data.get('email') || ''),
      phone: String(data.get('phone') || ''),
      businessName: String(data.get('businessName') || ''),
      website: String(data.get('website') || ''),
      improvements: selectedImprovements.join(', '),
      message: String(data.get('message') || ''),
      company: String(data.get('company') || ''),
    }

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
            <p className="form-kicker">REQUEST RECEIVED</p>
            <h2>We got it.</h2>
            <p>Your information has been sent. We will review what you shared and be in touch.</p>
            <button className="button" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <p className="form-kicker">GET STARTED</p>
            <h2>Let&apos;s build a better customer system.</h2>
            <p className="modal-intro">Tell us a little about the business and where you want to improve. We&apos;ll take it from there.</p>
            <form onSubmit={submitLead}>
              <div className="form-grid">
                <input required name="name" placeholder="Your name *" aria-label="Your name" autoComplete="name" />
                <input required name="email" type="email" placeholder="Email address *" aria-label="Email address" autoComplete="email" />
              </div>
              <div className="form-grid">
                <input name="phone" type="tel" placeholder="Phone number" aria-label="Phone number" autoComplete="tel" />
                <input required name="businessName" placeholder="Business name *" aria-label="Business name" autoComplete="organization" />
              </div>
              <input name="website" placeholder="Website URL" aria-label="Website URL" autoComplete="url" />
              <fieldset className="improvement-fieldset">
                <legend>What would you like to improve?</legend>
                <div className="improvement-grid">
                  {improvementOptions.map((option) => (
                    <label key={option} className="check-option">
                      <input type="checkbox" name="improvements" value={option} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <textarea name="message" placeholder="Anything else we should know?" rows={3} aria-label="Anything else we should know?" />
              <input className="honeypot" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <button className="button form-submit" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending...' : 'Get Started'}</button>
              <p className="form-note">No commitment required to submit a request.</p>
              {status === 'error' && <p className="form-error">{error}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function DashboardPreview() {
  const rows = [
    ['New Leads', '8', 'Today'],
    ['Follow-Ups Due', '14', 'This week'],
    ['Appointments', '23', 'Upcoming'],
    ['Recent Customers', '31', 'This month'],
    ['Open Conversations', '6', 'Needs attention'],
    ['Ready to Re-engage', '19', 'Past customers'],
  ]

  return (
    <div className="dashboard-preview">
      <div className="dashboard-top"><span>MARKET METHOD</span><strong>CUSTOMER SYSTEM</strong></div>
      <div className="dashboard-grid">
        {rows.map(([label, value, note]) => (
          <div className="dashboard-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-activity">
        <span>RECENT ACTIVITY</span>
        <div><strong>Lead follow-up</strong><small>Quote request · 12 min ago</small></div>
        <div><strong>Retention</strong><small>Service reminder · 1 hr ago</small></div>
        <div><strong>Customer service</strong><small>Question routed · 2 hrs ago</small></div>
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
        <a href="#top" className="brand" aria-label="Market Method home"><img src="/logo.png" alt="Market Method" /></a>
        <div className="nav-links">
          <a href="#system">The system</a>
          <a href="#process">How it works</a>
          <a href="#fit">Who it&apos;s for</a>
        </div>
        <button className="button nav-cta" onClick={() => setModal(true)}>Get Started</button>
      </nav>

      <section className="hero wrap" id="top">
        <div className="hero-copy">
          <p className="eyebrow">FOR LOCAL BUSINESSES</p>
          <h1>Get the customer. Keep the customer.</h1>
          <p className="hero-sub">Market Method connects your website, follow-up, customer records, and retention into one system built around the customer relationship.</p>
          <div className="hero-actions">
            <button className="button" onClick={() => setModal(true)}>Get Started</button>
            <button className="text-button" onClick={() => document.getElementById('system')?.scrollIntoView({ behavior: 'smooth' })}>See the System</button>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual-top"><span>THE CUSTOMER LIFECYCLE</span><span>01—05</span></div>
          <div className="hero-cycle">
            <div className="cycle-node cycle-primary"><span>01</span><strong>Find</strong><small>Website</small></div>
            <div className="cycle-line" />
            <div className="cycle-node"><span>02</span><strong>Reach</strong><small>Lead</small></div>
            <div className="cycle-line" />
            <div className="cycle-node"><span>03</span><strong>Follow</strong><small>Conversation</small></div>
            <div className="cycle-line" />
            <div className="cycle-node"><span>04</span><strong>Convert</strong><small>Customer</small></div>
            <div className="cycle-line" />
            <div className="cycle-node cycle-last"><span>05</span><strong>Return</strong><small>Retention</small></div>
          </div>
          <div className="hero-visual-bottom"><strong>GET</strong><span>→</span><strong>KEEP</strong></div>
        </div>
      </section>

      <section className="leak-section section-dark">
        <div className="wrap leak-inner">
          <div className="leak-head">
            <p className="eyebrow dark">WHERE REVENUE LEAKS</p>
            <h2>Most businesses don&apos;t have one big problem. They have gaps.</h2>
          </div>
          <div className="leak-statement">
            <div className="leak-row"><span>01</span><strong>A lead asks for a quote.</strong><em>Then waits.</em></div>
            <div className="leak-row"><span>02</span><strong>A customer finishes a job.</strong><em>Then hears nothing.</em></div>
            <div className="leak-row"><span>03</span><strong>A past customer needs you again.</strong><em>But nobody reaches out.</em></div>
            <div className="leak-row"><span>04</span><strong>The owner gets busy.</strong><em>The follow-up becomes another task.</em></div>
          </div>
        </div>
      </section>

      <section className="system-section wrap" id="system">
        <div className="system-intro">
          <div>
            <p className="eyebrow">ONE CONNECTED SYSTEM</p>
            <h2>One customer. One relationship. One place to manage it.</h2>
          </div>
          <p>Instead of stitching together a website, inbox, spreadsheet, reminders, and separate marketing tools, Market Method connects the parts that matter.</p>
        </div>
        <div className="lifecycle">
          <div className="lifecycle-track" />
          <article><span>01</span><strong>Attract</strong><p>Your website gives the right customer a clear reason to contact you.</p></article>
          <article><span>02</span><strong>Capture</strong><p>New inquiries become organized customer records instead of disappearing into an inbox.</p></article>
          <article><span>03</span><strong>Follow up</strong><p>The system keeps conversations moving when the customer does not respond right away.</p></article>
          <article><span>04</span><strong>Retain</strong><p>After the sale, reminders and follow-up create reasons to come back.</p></article>
        </div>
      </section>

      <section className="control-section section-stone">
        <div className="wrap control-grid">
          <div className="control-copy">
            <p className="eyebrow">THE OWNER VIEW</p>
            <h2>Know what is happening without chasing it down.</h2>
            <p>A simple customer system gives you a clear view of what needs attention today, what is coming next, and which customers are ready for another conversation.</p>
            <div className="control-points"><span>New leads</span><span>Follow-ups due</span><span>Appointments</span><span>Open conversations</span><span>Customers to re-engage</span></div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section className="retention-section section-dark">
        <div className="wrap retention-inner">
          <div className="retention-statement">
            <p className="eyebrow dark">AFTER THE SALE</p>
            <h2>The job ends. The relationship doesn&apos;t.</h2>
            <p>Market Method handles the routine moments that are easy to forget when you are busy serving customers.</p>
          </div>
          <div className="retention-sequence">
            <div><span>AFTER SERVICE</span><strong>Check in.</strong><p>Keep the relationship active.</p></div>
            <div><span>WHEN IT&apos;S DUE</span><strong>Remind them.</strong><p>Make the next service easier to schedule.</p></div>
            <div><span>WHEN THEY GO QUIET</span><strong>Reach out.</strong><p>Give past customers a reason to come back.</p></div>
          </div>
        </div>
      </section>

      <section className="fit-section wrap" id="fit">
        <div className="fit-banner">
          <div><p className="eyebrow">BUILT FOR THE WAY LOCAL BUSINESS WORKS</p><h2>When a customer matters beyond the first sale, this matters.</h2></div>
          <p>Market Method fits businesses built on calls, quotes, appointments, repeat service, and customer relationships.</p>
        </div>
        <div className="fit-strip"><span>HOME SERVICES</span><span>CLEANING</span><span>AUTO SERVICES</span><span>DENTAL</span><span>BEAUTY</span><span>PROFESSIONAL SERVICES</span></div>
      </section>

      <section className="faq wrap">
        <div><p className="eyebrow">QUESTIONS</p><h2>Before you get started.</h2></div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => <div className="faq-row" key={question}><button onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index}><span>{question}</span><span className="faq-mark">{open === index ? '−' : '+'}</span></button>{open === index && <p>{answer}</p>}</div>)}
        </div>
      </section>

      <section className="cta"><div className="wrap cta-inner"><div className="cta-mark">GET → KEEP</div><h2>Build the system behind the customer.</h2><p>Start with what is missing. Build from there.</p><button className="button" onClick={() => setModal(true)}>Get Started</button></div></section>

      <footer className="footer wrap">
        <a href="#top" className="brand footer-brand" aria-label="Market Method home"><img src="/logo.png" alt="Market Method" /></a>
        <p>Customer acquisition, follow-up, and retention systems for local businesses.</p>
        <p>© 2026 Market Method, a division of Kova Media Group</p>
      </footer>

      {modal && <LeadModal onClose={() => setModal(false)} />}
    </main>
  )
}
