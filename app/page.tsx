'use client'

import { FormEvent, useState } from 'react'

const systems = [
  ['Website', 'Turn visitors into leads.'],
  ['CRM', 'Know who your customers are and what happens next.'],
  ['Lead Nurture', "Follow up automatically when a lead doesn't respond."],
  ['Customer Retention', 'Bring customers back before they forget about you.'],
  ['Customer Service', 'Handle routine questions and requests automatically.'],
]

const industries = ['Home Services', 'Cleaning', 'Auto Services', 'Dental', 'Beauty & Personal Care', 'Professional Services']

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
          <p className="eyebrow">CUSTOMER ACQUISITION · FOLLOW-UP · RETENTION</p>
          <h1>Turn more leads into customers. Turn more customers into repeat business.</h1>
          <p className="hero-sub">Your website gets the customer in the door. Market Method helps you get more from every customer.</p>
          <p className="hero-detail">We build the website and the systems behind it to capture customers, follow up with leads, keep customer relationships organized, and bring people back.</p>
          <div className="hero-actions">
            <button className="button" onClick={() => setModal(true)}>Get Started</button>
            <button className="text-button" onClick={() => document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}>See How It Works</button>
          </div>
        </div>
        <div className="hero-system">
          <div className="system-label">ONE CONNECTED SYSTEM</div>
          <div className="system-flow">
            <div><strong>Website</strong><span>Capture</span></div>
            <div><strong>Lead</strong><span>Organize</span></div>
            <div><strong>Follow-Up</strong><span>Nurture</span></div>
            <div><strong>Customer</strong><span>Serve</span></div>
            <div><strong>Retention</strong><span>Return</span></div>
          </div>
        </div>
      </section>

      <section className="problem section-dark">
        <div className="wrap problem-inner">
          <div className="problem-copy">
            <p className="eyebrow dark">THE PROBLEM</p>
            <h2>A customer reaches out. Then the process breaks down.</h2>
          </div>
          <div className="problem-list">
            <div><strong>They call.</strong><span>No one gets back to them.</span></div>
            <div><strong>They ask for a quote.</strong><span>The follow-up gets forgotten.</span></div>
            <div><strong>They become a customer.</strong><span>Nothing brings them back.</span></div>
            <div><strong>The owner gets busy.</strong><span>Every message becomes another task.</span></div>
          </div>
        </div>
      </section>

      <section className="system-section wrap" id="system">
        <div className="section-head">
          <div><p className="eyebrow">ONE SYSTEM</p><h2>Every part works together.</h2></div>
          <p>The website, customer records, follow-up, retention, and communication are connected instead of living in separate tools and processes.</p>
        </div>
        <div className="system-journey">
          <div><span>01</span><strong>Website</strong><small>Customer finds you</small></div>
          <div><span>02</span><strong>Lead</strong><small>They reach out</small></div>
          <div><span>03</span><strong>Follow-Up</strong><small>Stay in the conversation</small></div>
          <div><span>04</span><strong>Customer</strong><small>Book or buy</small></div>
          <div><span>05</span><strong>Retention</strong><small>Come back again</small></div>
        </div>
      </section>

      <section className="offer section-stone">
        <div className="wrap">
          <div className="section-head">
            <div><p className="eyebrow">WHAT MARKET METHOD DOES</p><h2>The infrastructure behind the customer.</h2></div>
            <p>Five connected pieces built around the way local businesses actually acquire and keep customers.</p>
          </div>
          <div className="offer-grid">
            {systems.map(([title, description], index) => (
              <article className="offer-card" key={title}>
                <span className="offer-number">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="process wrap" id="process">
        <div className="process-intro">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>Simple for you. Connected behind the scenes.</h2>
        </div>
        <div className="process-list">
          <article className="process-row"><span>01</span><div><h3>We build your system.</h3><p>We set up the website and the customer systems around the parts of your business that need the most attention.</p></div></article>
          <article className="process-row"><span>02</span><div><h3>Customers contact your business.</h3><p>Calls, forms, quote requests, appointments, and other customer inquiries flow into the system.</p></div></article>
          <article className="process-row"><span>03</span><div><h3>Market Method follows up.</h3><p>Leads get timely follow-up instead of disappearing because nobody had time to chase them.</p></div></article>
          <article className="process-row"><span>04</span><div><h3>You close the business and serve the customer.</h3><p>The system keeps the relationship organized and creates opportunities to bring the customer back.</p></div></article>
        </div>
      </section>

      <section className="website-section section-dark">
        <div className="wrap feature-grid">
          <div><p className="eyebrow dark">THE WEBSITE</p><h2>Your website is the front door.</h2><p className="feature-copy">We build a modern, conversion-focused website that makes it easy for the right customer to contact you. It connects directly to the rest of the Market Method system.</p></div>
          <div className="feature-points"><div><strong>Clear</strong><span>Customers understand what you do and what to do next.</span></div><div><strong>Focused</strong><span>Calls, forms, quote requests, and bookings have a clear path.</span></div><div><strong>Connected</strong><span>New inquiries move into the customer system instead of stopping at the website.</span></div></div>
        </div>
      </section>

      <section className="crm-section wrap">
        <div className="feature-grid crm-grid">
          <div><p className="eyebrow">CRM + AUTOMATION</p><h2>Know what needs attention.</h2><p className="feature-copy">A simple owner-facing system keeps leads, customers, appointments, conversations, and follow-ups organized in one place.</p></div>
          <DashboardPreview />
        </div>
      </section>

      <section className="retention section-stone">
        <div className="wrap feature-grid">
          <div><p className="eyebrow">RETENTION</p><h2>Getting the customer is only part of the job.</h2><p className="feature-copy">Market Method can automate the routine communication that keeps the relationship moving.</p></div>
          <div className="retention-list">
            <div><strong>After-service follow-up</strong><span>Check in after the job and keep the relationship active.</span></div>
            <div><strong>Appointment reminders</strong><span>Help customers remember what they already scheduled.</span></div>
            <div><strong>Review requests</strong><span>Ask satisfied customers for feedback at the right time.</span></div>
            <div><strong>Repeat-service reminders</strong><span>Reach out when another service is likely to be due.</span></div>
            <div><strong>Reactivation</strong><span>Bring back customers who have gone quiet.</span></div>
            <div><strong>Promotional campaigns</strong><span>Give existing customers another reason to buy.</span></div>
          </div>
        </div>
      </section>

      <section className="service section-dark">
        <div className="wrap feature-grid">
          <div><p className="eyebrow dark">AUTOMATED CUSTOMER SERVICE</p><h2>Let the system handle the routine.</h2><p className="feature-copy">We are building toward automated phone and email customer service that can answer common questions, collect information, handle routine requests, book appointments, and hand complicated situations to a real person.</p><span className="capability-note">AN EVOLVING CAPABILITY</span></div>
          <div className="service-flow"><div><span>Customer calls or emails</span><strong>Common question?</strong></div><div><span>System handles the routine</span><strong>Collects information</strong></div><div><span>Booking or next step</span><strong>Moves the customer forward</strong></div><div><span>Something complex?</span><strong>Hands it to a person</strong></div></div>
        </div>
      </section>

      <section className="fit wrap" id="fit">
        <div className="section-head fit-head">
          <div><p className="eyebrow">WHO IT&apos;S FOR</p><h2>Built for local businesses where every customer matters.</h2></div>
          <p>Especially useful for businesses that depend on appointments, quotes, repeat service, or ongoing customer relationships.</p>
        </div>
        <div className="industry-list">{industries.map((industry, index) => <div key={industry}><span>0{index + 1}</span><h3>{industry}</h3></div>)}</div>
      </section>

      <section className="outcome section-dark">
        <div className="wrap outcome-inner">
          <div><p className="eyebrow dark">THE OUTCOME</p><h2>Stop losing customers between the cracks.</h2></div>
          <div className="outcome-points"><p>Capture more leads.</p><p>Follow up faster.</p><p>Stay organized.</p><p>Bring customers back.</p><p>Spend less time answering the same questions.</p></div>
        </div>
      </section>

      <section className="faq wrap">
        <div><p className="eyebrow">QUESTIONS</p><h2>Before you get started.</h2></div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => <div className="faq-row" key={question}><button onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index}><span>{question}</span><span className="faq-mark">{open === index ? '−' : '+'}</span></button>{open === index && <p>{answer}</p>}</div>)}
        </div>
      </section>

      <section className="cta"><div className="wrap cta-inner"><p className="eyebrow">GET STARTED</p><h2>Build a better customer system.</h2><p>Start with the website. Build from there.</p><button className="button" onClick={() => setModal(true)}>Get Started</button></div></section>

      <footer className="footer wrap">
        <a href="#top" className="brand footer-brand" aria-label="Market Method home"><img src="/logo.png" alt="Market Method" /></a>
        <p>Customer acquisition, follow-up, and retention systems for local businesses.</p>
        <p>© 2026 Market Method, a division of Kova Media Group</p>
      </footer>

      {modal && <LeadModal onClose={() => setModal(false)} />}
    </main>
  )
}
