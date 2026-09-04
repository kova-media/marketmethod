'use client'

import { ArrowUpRight, BarChart3, CalendarDays, Check, ChevronDown, Clock3, PhoneCall, RefreshCw, Star, Target, UsersRound, X } from 'lucide-react'
import { useState } from 'react'

const systems = [
  ['01', 'Website', 'A modern website built to turn visits into conversations.'],
  ['02', 'Lead capture', 'Forms and service requests that make contacting you easy.'],
  ['03', 'Booking', 'Scheduling that removes the back-and-forth from getting the job.'],
  ['04', 'Follow-up', 'Automatic follow-up for people who inquire but do not book.'],
  ['05', 'Reactivation', 'Bring previous customers back when they are ready to buy again.'],
  ['06', 'Reviews', 'Automatically ask happy customers for more Google reviews.'],
  ['07', 'Attribution', 'See where leads came from and what happened next.'],
  ['08', 'Revenue', 'Connect marketing activity to booked jobs and actual revenue.'],
]

const industries = ['Home services', 'Professional services', 'Health & wellness', 'Automotive', 'Local specialty businesses']

function LeadModal({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <button className="close" onClick={onClose} aria-label="Close"><X size={20}/></button>
      <div className="eyebrow">WORK WITH MARKET METHOD</div>
      <h2>Let&apos;s find the leaks.</h2>
      <p>Tell us a little about your business. We&apos;ll take a look at how customers currently find, contact, and book you.</p>
      <form onSubmit={e => { e.preventDefault(); alert('Thanks. We will be in touch.') }}>
        <input required placeholder="Your name" />
        <input required type="email" placeholder="Email address" />
        <input required placeholder="Business name" />
        <input placeholder="Website URL" />
        <textarea placeholder="What would you like to improve?" rows={4}/>
        <button className="button button-dark" type="submit">Request a look <ArrowUpRight size={17}/></button>
      </form>
    </div>
  </div>
}

export default function Home() {
  const [modal, setModal] = useState(false)
  const [open, setOpen] = useState<number | null>(null)

  return <main>
    <nav className="nav wrap">
      <a href="#top" className="logo"><span>MARKET</span><span>METHOD</span></a>
      <div className="nav-links"><a href="#system">The system</a><a href="#process">How it works</a><a href="#fit">Who it&apos;s for</a></div>
      <button className="button button-dark nav-cta" onClick={() => setModal(true)}>Apply to work with us <ArrowUpRight size={16}/></button>
    </nav>

    <section className="hero wrap" id="top">
      <div className="hero-copy">
        <div className="eyebrow"><span className="dot"/> REVENUE INFRASTRUCTURE FOR LOCAL BUSINESS</div>
        <h1>More leads.<br/><em>More booked jobs.</em></h1>
        <p className="hero-sub">Market Method builds the websites, lead systems, follow-up, scheduling, and customer reactivation systems that turn more demand into revenue.</p>
        <div className="hero-actions"><button className="button button-dark" onClick={() => document.getElementById('system')?.scrollIntoView({behavior:'smooth'})}>See how it works <ArrowUpRight size={17}/></button><button className="text-button" onClick={() => setModal(true)}>Apply to work with us <span>↗</span></button></div>
      </div>
      <div className="hero-visual">
        <div className="grid-lines"/>
        <div className="signal-card card-a"><span>NEW LEAD</span><strong>Roof repair</strong><small>2 min ago</small></div>
        <div className="signal-card card-b"><span>FOLLOW-UP</span><strong>Quote requested</strong><small>Message sent automatically</small></div>
        <div className="signal-card card-c"><span>BOOKED</span><strong>$2,840 job</strong><small>Source: Google</small></div>
        <div className="orb"><Target size={34}/></div>
        <div className="orbit orbit-1"/><div className="orbit orbit-2"/>
      </div>
    </section>

    <section className="statement"><div className="wrap statement-inner"><span className="section-number">01</span><div><p className="big-statement">You don&apos;t need more marketing. You need more of the opportunities you&apos;re already getting to turn into jobs.</p><p className="muted">Most local businesses lose revenue between the first click and the finished job. We build the system that closes those gaps.</p></div></div></section>

    <section className="system wrap" id="system">
      <div className="section-head"><div><div className="eyebrow">THE MARKET METHOD SYSTEM</div><h2>Every part of the<br/><em>customer journey.</em></h2></div><p>One connected system instead of a stack of disconnected marketing services.</p></div>
      <div className="system-grid">{systems.map(([num,title,desc]) => <div className="system-item" key={num}><span>{num}</span><div><h3>{title}</h3><p>{desc}</p></div></div>)}</div>
    </section>

    <section className="leaks"><div className="wrap leak-inner"><div><div className="eyebrow light">WHERE REVENUE LEAKS</div><h2>The lead is not<br/>the finish line.</h2><p>Getting someone to your website is only one step. We look at what happens before, during, and after the inquiry.</p></div><div className="funnel"><div className="funnel-row"><span>1,000</span><b>VISITORS</b><i>100%</i></div><div className="funnel-row"><span>120</span><b>INQUIRIES</b><i>12%</i></div><div className="funnel-row"><span>67</span><b>BOOKED</b><i>56%</i></div><div className="funnel-row final"><span>54</span><b>JOBS</b><i>81%</i></div></div></div></section>

    <section className="process wrap" id="process">
      <div className="section-head"><div><div className="eyebrow">HOW IT WORKS</div><h2>Build the system.<br/><em>Measure the result.</em></h2></div></div>
      <div className="process-list">{[
        ['01','Find the leaks','We audit how customers find you, contact you, and become customers.'],
        ['02','Build the system','We build the website and revenue infrastructure around the gaps we find.'],
        ['03','Turn it on','Lead capture, follow-up, scheduling, reviews, and reactivation start working together.'],
        ['04','Measure revenue','We track the path from lead to booked job, so performance is tied to something that matters.'],
      ].map(([n,t,d]) => <div className="process-row" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p><ArrowUpRight size={20}/></div>)}</div>
    </section>

    <section className="risk"><div className="wrap risk-grid"><div><div className="eyebrow">OUR MODEL</div><h2>We put more of<br/><em>our compensation at risk.</em></h2></div><div><p className="risk-big">Instead of charging thousands upfront for a website and handing you the keys, we can build and operate the growth system with little or no upfront cost.</p><p className="muted">When the system produces more revenue, we participate in the upside. The exact structure depends on the business and the opportunity.</p></div></div></section>

    <section className="fit wrap" id="fit"><div className="section-head"><div><div className="eyebrow">WHO IT&apos;S FOR</div><h2>Built for businesses<br/><em>where a lead has value.</em></h2></div><p>We work across local service categories. If customers find you online and a new job is worth real money, the model can work.</p></div><div className="industry-grid">{industries.map((x,i)=><div key={x}><span>0{i+1}</span><h3>{x}</h3><ArrowUpRight size={19}/></div>)}</div></section>

    <section className="faq wrap"><div className="eyebrow">COMMON QUESTIONS</div><div className="faq-list">{[
      ['Is Market Method a marketing agency?','Not in the traditional sense. We are focused on the revenue system behind your marketing: the website, lead capture, follow-up, booking, reactivation, reviews, attribution, and measurement.'],
      ['Do I have to pay for a new website upfront?','Not necessarily. Depending on the business and opportunity, we can structure the engagement with little or no upfront cost and align compensation with results.'],
      ['What kinds of businesses do you work with?','Local service businesses where a qualified lead can become a meaningful revenue event. That includes home services, professional services, health and wellness, automotive, and specialty businesses.'],
      ['How do you measure results?','We start with the lead and follow the customer journey through booking and, where the data is available, the completed job and revenue.'],
    ].map(([q,a],i)=><div className="faq-row" key={q} onClick={()=>setOpen(open===i?null:i)}><div><h3>{q}</h3>{open===i&&<p>{a}</p>}</div><ChevronDown className={open===i?'rot':''}/></div>)}</div></section>

    <section className="cta"><div className="wrap cta-inner"><div className="eyebrow light">STOP LEAVING REVENUE ON THE TABLE</div><h2>Build the system.<br/><em>Book more jobs.</em></h2><button className="button button-light" onClick={()=>setModal(true)}>Apply to work with us <ArrowUpRight size={17}/></button></div></section>

    <footer className="footer wrap"><div className="logo"><span>MARKET</span><span>METHOD</span></div><div>Revenue infrastructure for local service businesses.</div><div>© 2026 Market Method</div></footer>
    {modal&&<LeadModal onClose={()=>setModal(false)}/>} 
  </main>
}