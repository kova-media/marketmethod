'use client'

import { useState } from 'react'

const systems = [
  ['Website', 'A clear first impression that gives prospective customers a reason to contact you.'],
  ['Lead capture', 'Simple forms and service requests that make the next step obvious.'],
  ['Scheduling', 'Booking tools that remove unnecessary back-and-forth.'],
  ['Lead follow-up', 'Timely follow-up for people who inquire but do not book right away.'],
  ['Customer reactivation', 'Thoughtful outreach to past customers when another job may be relevant.'],
  ['Review requests', 'A consistent process for asking satisfied customers to leave a Google review.'],
  ['Attribution', 'A clearer view of where inquiries originate and what happens after they arrive.'],
  ['Revenue tracking', 'Connect the customer journey to booked work and revenue where the data allows.'],
]

const industries = [
  'Home services',
  'Professional services',
  'Health & wellness',
  'Automotive',
  'Local specialty businesses',
]

const faqs = [
  ['Is Market Method a marketing agency?', 'Not in the traditional sense. We focus on the revenue system behind your marketing: the website, lead capture, follow-up, booking, reactivation, reviews, attribution, and measurement.'],
  ['Do I have to pay for a new website upfront?', 'Not necessarily. Depending on the business and opportunity, an engagement can be structured with little or no upfront cost and compensation tied to results.'],
  ['What kinds of businesses do you work with?', 'Local service businesses where a qualified lead can become a meaningful revenue event. That includes home services, professional services, health and wellness, automotive, and specialty businesses.'],
  ['How do you measure results?', 'We start with the inquiry and follow the customer journey through booking and, where the data is available, the completed job and resulting revenue.'],
]

function LeadModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">Close</button>
        <h2>Let&apos;s look at where the money is getting lost.</h2>
        <p className="modal-intro">Tell us about the business, the website, and what happens when a customer reaches out. We&apos;ll start there.</p>
        <form onSubmit={(event) => { event.preventDefault(); alert('Thanks. We will be in touch.') }}>
          <input required placeholder="Your name" aria-label="Your name" />
          <input required type="email" placeholder="Email address" aria-label="Email address" />
          <input required placeholder="Business name" aria-label="Business name" />
          <input placeholder="Website URL" aria-label="Website URL" />
          <textarea placeholder="What would you like to improve?" rows={4} aria-label="What would you like to improve?" />
          <button className="button button-dark" type="submit">Request a look</button>
        </form>
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
        <button className="button button-dark nav-cta" onClick={() => setModal(true)}>Apply to work with us</button>
      </nav>

      <section className="hero wrap" id="top">
        <div className="hero-copy">
          <h1>More of the people who find you should become customers.</h1>
          <p className="hero-sub">Market Method builds and operates the website, lead capture, follow-up, scheduling, and customer reactivation systems that sit between demand and revenue.</p>
          <div className="hero-actions">
            <button className="button button-dark" onClick={() => document.getElementById('system')?.scrollIntoView({ behavior: 'smooth' })}>See how it works</button>
            <button className="text-button" onClick={() => setModal(true)}>Apply to work with us</button>
          </div>
        </div>
        <div className="hero-note" aria-label="Market Method point of view">
          <blockquote>Getting a lead is not the same thing as getting the job.</blockquote>
          <span>There are usually several steps between the first inquiry and the finished job. We work on those steps.</span>
        </div>
      </section>

      <section className="statement">
        <div className="wrap statement-inner">
          <div>
            <p className="big-statement">You may not need more traffic. You may need a better system for handling the traffic you already have.</p>
            <p className="statement-support">A missed call, a slow reply, a difficult booking process, or an old customer who never hears from you again can all mean lost revenue.</p>
          </div>
        </div>
      </section>

      <section className="system wrap" id="system">
        <div className="section-head">
          <div>
            <h2>One customer journey.<br /><em>One connected system.</em></h2>
          </div>
          <p>Instead of handing you another collection of marketing services, we work on the parts of the customer journey that determine whether demand turns into work.</p>
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
            <h2>The gaps are usually between the obvious parts of the funnel.</h2>
            <p>A business can have a good website and still lose inquiries. It can generate calls and still miss jobs. It can have hundreds of past customers and never give them a reason to come back.</p>
          </div>
          <div className="journey-path" aria-label="Customer journey from discovery to revenue">
            <div><strong>Find</strong><span>Someone discovers the business.</span></div>
            <div><strong>Contact</strong><span>They call, submit a request, or start a conversation.</span></div>
            <div><strong>Decide</strong><span>They receive a response, quote, or booking option.</span></div>
            <div><strong>Book</strong><span>The opportunity becomes scheduled work.</span></div>
            <div><strong>Return</strong><span>The customer has a reason to come back.</span></div>
          </div>
        </div>
      </section>

      <section className="process wrap" id="process">
        <div className="process-intro">
          <h2>We find the weak points, then build around them.</h2>
        </div>
        <div className="process-list">
          <article className="process-row">
            <h3>Find the leaks</h3>
            <p>We look at how customers find you, what happens when they reach out, and where opportunities disappear.</p>
          </article>
          <article className="process-row">
            <h3>Build the system</h3>
            <p>We build the website and supporting infrastructure around the gaps that matter most.</p>
          </article>
          <article className="process-row">
            <h3>Operate it</h3>
            <p>Follow-up, booking, review requests, reactivation, and measurement become part of the operating system.</p>
          </article>
          <article className="process-row">
            <h3>Measure revenue</h3>
            <p>We follow the path from inquiry to booked work and, where possible, to the revenue that work creates.</p>
          </article>
        </div>
      </section>

      <section className="risk">
        <div className="wrap risk-grid">
          <div>
            <h2>Our incentives should look more like yours.</h2>
          </div>
          <div>
            <p className="risk-big">Instead of charging thousands upfront for a website and handing you the keys, we can structure the engagement around the opportunity we see.</p>
            <p className="muted">That can mean little or no upfront cost, with Market Method participating in the upside when the system produces additional revenue. The structure depends on the business.</p>
          </div>
        </div>
      </section>

      <section className="fit wrap" id="fit">
        <div className="section-head fit-head">
          <div>
            <h2>Local businesses where a new customer is worth something.</h2>
          </div>
          <p>We are intentionally not limited to one trade. The model works anywhere the customer journey can be improved and the resulting work can be measured.</p>
        </div>
        <div className="industry-list">
          {industries.map((industry) => <div key={industry}><h3>{industry}</h3></div>)}
        </div>
      </section>

      <section className="faq wrap">
        <div>
          <h2>Before we talk numbers.</h2>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
            <div className="faq-row" key={question}>
              <button onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index}>
                <span>{question}</span>
                <span className="faq-mark">{open === index ? '−' : '+'}</span>
              </button>
              {open === index && <p>{answer}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <div className="wrap cta-inner">
          <h2>Let&apos;s see where the next job is getting lost.</h2>
          <button className="button button-light" onClick={() => setModal(true)}>Apply to work with us</button>
        </div>
      </section>

      <footer className="footer wrap">
        <div className="brand footer-brand"><img src="/logo.svg" alt="Market Method" /></div>
        <p>Revenue infrastructure for local service businesses.</p>
        <p>© 2026 Market Method</p>
      </footer>

      {modal && <LeadModal onClose={() => setModal(false)} />}
    </main>
  )
}
