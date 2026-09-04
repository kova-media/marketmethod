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
  ['Revenue tracking', 'Connect leads and bookings to the revenue they create.'],
]

const industries = ['Automotive', 'Healthcare practices', 'Personal care', 'Skilled trades', 'Professional services', 'Local specialty businesses']

const faqs = [
  ['Is Market Method a marketing agency?', 'Not in the traditional sense. We focus on what happens after someone finds your business: contacting you, getting a response, booking, returning, and becoming revenue.'],
  ['Do I have to pay for a new website upfront?', 'Not necessarily. Depending on the business and opportunity, an engagement can be structured with little or no upfront cost and compensation tied to results.'],
  ['What kinds of businesses do you work with?', 'Local service businesses where a qualified inquiry can become a meaningful revenue event. That can include mechanics, dental and eye care practices, barbers, tailors, trades, and other local businesses that serve customers directly.'],
  ['How do you measure results?', 'We start with the inquiry and follow the customer journey through booking and, where the data is available, the completed service and resulting revenue.'],
]

const improvementOptions = [
  'Get more leads',
  'Get more calls',
  'Turn more leads into customers',
  'Follow up with leads',
  'Get more repeat customers',
  'Improve the website',
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
            <p className="form-kicker">BUSINESS REVIEW</p>
            <h2>Let&apos;s find where your business can improve.</h2>
            <p className="modal-intro">A few details about the business and what you want to improve. We&apos;ll use them to understand where to look.</p>
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
              <button className="button form-submit" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending...' : 'Request a business review'}</button>
              <p className="form-note">No commitment required to submit a request.</p>
              {status === 'error' && <p className="form-error">{error}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function RevenueCalculator() {
  const [averageCustomerValue, setAverageCustomerValue] = useState(500)
  const [leads, setLeads] = useState(40)
  const [conversionRate, setConversionRate] = useState(25)
  const [targetRate, setTargetRate] = useState(35)

  const currentRevenue = Math.round(averageCustomerValue * leads * (conversionRate / 100))
  const targetRevenue = Math.round(averageCustomerValue * leads * (targetRate / 100))
  const difference = Math.max(0, targetRevenue - currentRevenue)

  return (
    <section className="calculator">
      <div className="wrap calculator-grid">
        <div className="calculator-copy">
          <h2>See what a better conversion rate could be worth.</h2>
          <p>This is a planning tool, not a forecast. Change the assumptions to see the difference between your current conversion rate and a higher one.</p>
        </div>
        <div className="calculator-box">
          <div className="calc-inputs">
            <label>Average customer value <span>${averageCustomerValue.toLocaleString()}</span><input type="range" min="50" max="5000" step="50" value={averageCustomerValue} onChange={(e) => setAverageCustomerValue(Number(e.target.value))} /></label>
            <label>Inquiries per month <span>{leads}</span><input type="range" min="5" max="200" step="5" value={leads} onChange={(e) => setLeads(Number(e.target.value))} /></label>
            <label>Current conversion rate <span>{conversionRate}%</span><input type="range" min="1" max="80" value={conversionRate} onChange={(e) => setConversionRate(Number(e.target.value))} /></label>
            <label>Comparison conversion rate <span>{targetRate}%</span><input type="range" min="1" max="80" value={targetRate} onChange={(e) => setTargetRate(Number(e.target.value))} /></label>
          </div>
          <div className="calc-results">
            <div><span>Current monthly revenue</span><strong>${currentRevenue.toLocaleString()}</strong></div>
            <div><span>At {targetRate}% conversion</span><strong>${targetRevenue.toLocaleString()}</strong></div>
            <div className="calc-difference"><span>Difference</span><strong>${difference.toLocaleString()}</strong></div>
          </div>
        </div>
      </div>
    </section>
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
        <button className="button nav-cta" onClick={() => setModal(true)}>Get your business reviewed</button>
      </nav>

      <section className="hero wrap" id="top">
        <div className="hero-copy">
          <h1>Turn more inquiries into customers.</h1>
          <p className="hero-sub">We build and operate the system that turns a customer finding your business into a customer paying you.</p>
          <div className="hero-actions">
            <button className="button" onClick={() => setModal(true)}>Get your business reviewed</button>
            <button className="text-button" onClick={() => document.getElementById('system')?.scrollIntoView({ behavior: 'smooth' })}>See what we build</button>
          </div>
        </div>
        <div className="hero-gap">
          <p className="hero-gap-label">THE GAP</p>
          <p className="hero-gap-headline">A lead is not revenue.</p>
          <div className="hero-gap-flow">
            <div><strong>Inquiry</strong><span>Someone raises their hand.</span></div>
            <div><strong>Response</strong><span>They get a useful next step.</span></div>
            <div><strong>Booking</strong><span>The opportunity becomes a customer.</span></div>
            <div><strong>Revenue</strong><span>The customer is measured as revenue.</span></div>
          </div>
        </div>
      </section>

      <section className="statement">
        <div className="wrap statement-inner">
          <div className="statement-main">
            <h2>Most businesses work hard to get the lead. Then they leave the rest to chance.</h2>
            <p>Market Method takes responsibility for the part that comes next.</p>
          </div>
          <div className="statement-points">
            <div><h3>Respond</h3><p>Make sure the inquiry gets a fast, useful response.</p></div>
            <div><h3>Convert</h3><p>Make the next step simple enough to complete.</p></div>
            <div><h3>Return</h3><p>Bring past customers back when there is another reason to buy.</p></div>
          </div>
        </div>
      </section>

      <section className="system wrap" id="system">
        <div className="section-head">
          <div><h2>The pieces that turn demand into customers.</h2></div>
          <p>One connected system, built around the way your customers actually buy.</p>
        </div>
        <div className="system-list">
          {systems.map(([title, description]) => <article className="system-item" key={title}><h3>{title}</h3><p>{description}</p></article>)}
        </div>
      </section>

      <RevenueCalculator />

      <section className="journey">
        <div className="wrap journey-inner">
          <div className="journey-copy">
            <h2>Where the money gets lost.</h2>
            <p>A customer can find you, contact you, and still never become a customer. We build around those gaps.</p>
          </div>
          <div className="journey-path" aria-label="Customer journey from discovery to revenue">
            <div><strong>Find</strong><span>Someone discovers the business.</span></div>
            <div><strong>Contact</strong><span>They call, submit a request, or start a conversation.</span></div>
            <div><strong>Decide</strong><span>They get a response, quote, or booking option.</span></div>
            <div><strong>Book</strong><span>The opportunity becomes a scheduled appointment or service.</span></div>
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
          <article className="process-row"><h3>Measure revenue</h3><p>We follow the path from inquiry to customer and, where possible, the revenue it creates.</p></article>
        </div>
      </section>

      <section className="risk">
        <div className="wrap risk-grid">
          <div><h2>Our incentives should look more like yours.</h2></div>
          <div><p className="risk-big">We can put more of our compensation at risk.</p><p className="muted">Depending on the business, that can mean little or no upfront cost, with Market Method participating in the upside when the system produces additional revenue.</p></div>
        </div>
      </section>

      <section className="fit wrap" id="fit">
        <div className="section-head fit-head">
          <div><h2>Built for local service businesses.</h2></div>
          <p>We are intentionally not limited to one trade. The model can apply to businesses that serve customers directly and where the customer journey can be improved and measured.</p>
        </div>
        <div className="industry-list">{industries.map((industry) => <div key={industry}><h3>{industry}</h3></div>)}</div>
        <p className="fit-examples">Think mechanics, dentists, eye doctors, barbers, tailors, trades, and other local businesses where getting and keeping a customer matters.</p>
      </section>

      <section className="faq wrap">
        <div><h2>Before we talk numbers.</h2></div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => <div className="faq-row" key={question}><button onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index}><span>{question}</span><span className="faq-mark">{open === index ? '−' : '+'}</span></button>{open === index && <p>{answer}</p>}</div>)}
        </div>
      </section>

      <section className="cta"><div className="wrap cta-inner"><h2>Find the customers you are losing.</h2><button className="button" onClick={() => setModal(true)}>Get your business reviewed</button></div></section>

      <footer className="footer wrap">
        <a href="#top" className="brand footer-brand" aria-label="Market Method home"><img src="/logo.png" alt="Market Method" /></a>
        <p>Revenue infrastructure for local service businesses.</p>
        <p>© 2026 Market Method, a division of Kova Media Group</p>
      </footer>

      {modal && <LeadModal onClose={() => setModal(false)} />}
    </main>
  )
}
