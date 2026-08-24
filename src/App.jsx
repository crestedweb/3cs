import { useState } from 'react'
import './App.css'

const careOptions = [
  'Home care',
  'Dementia care',
  'Respite care',
  'Live-in care',
  'Supported living',
  'Companionship',
]

const journeySteps = [
  {
    title: 'Tell us what care is needed',
    text: 'Families share the care type, location, urgency and preferred budget in a short enquiry form.',
  },
  {
    title: 'We match and qualify the lead',
    text: 'We check the need against local care requirements and pass only relevant, suitable enquiries to vetted providers.',
  },
  {
    title: 'Providers respond and assess',
    text: 'Registered providers review the request, contact the family, and complete the assessment and service delivery.',
  },
]

const providerBenefits = [
  'Qualified private-care enquiries from real families',
  'Local matching by care type, area and urgency',
  'Simple onboarding for CQC-registered providers',
  'Lead management and referral tracking',
]

const faqs = [
  {
    question: 'Are providers vetted?',
    answer: 'Yes. Verification is a core feature of the platform, with registration checks and service-area validation built into onboarding.',
  },
  {
    question: 'Is this a care agency?',
    answer: 'No. The model is referral-led and marketplace-based. 3CS introduces families to suitable providers rather than delivering the regulated service directly.',
  },
  {
    question: 'Do providers pay for leads?',
    answer: 'The platform is designed around a lead-generation and referral framework, with provider membership or per-lead pricing as the commercial core.',
  },
]

const initialForm = {
  name: '',
  email: '',
  phone: '',
  postcode: '',
  careNeed: 'Home care',
  budget: '£20 - £40 per hour',
  urgency: 'Within 2 weeks',
  message: '',
}

function App() {
  const [formData, setFormData] = useState(initialForm)
  const [status, setStatus] = useState({ type: 'idle', message: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: 'pending', message: 'Submitting your care enquiry...' })

    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const payload = await response.json().catch(() => ({ error: 'Request failed.' }))

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to submit your enquiry.')
      }

      setStatus({
        type: 'success',
        message: 'Your enquiry has been submitted. A care specialist will be in touch shortly.',
      })
      setFormData(initialForm)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Something went wrong. Please try again.',
      })
    }
  }

  return (
    <div className="care-marketplace-shell">
      <header className="topbar container">
        <div className="brand-block">
          <div className="brand-mark">3CS</div>
          <div>
            <div className="brand-name">3CS Care Services</div>
            <div className="brand-tag">Care matching & referrals</div>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#for-families">For families</a>
          <a href="#for-providers">For providers</a>
          <a href="#faq">FAQ</a>
        </nav>

        <a className="button button-secondary" href="#enquiry-form">
          Get started
        </a>
      </header>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <span className="eyebrow">Independent care matching</span>
            <h1>Helping families find the right care provider, faster.</h1>
            <p>
              3CS connects families with suitable, regulated care providers through a simple,
              trust-first referral model built for private care and supported living.
            </p>

            <div className="cta-row">
              <a className="button button-primary" href="#enquiry-form">
                Request a care match
              </a>
              <a className="button button-ghost" href="#for-providers">
                Join as a provider
              </a>
            </div>

            <ul className="hero-points" aria-label="Key benefits">
              <li>Verified provider network</li>
              <li>Qualified care enquiries</li>
              <li>Trusted referral workflow</li>
            </ul>
          </div>

          <div className="hero-card" id="enquiry-form">
            <div className="card-header">
              <span className="mini-badge">New enquiry</span>
              <h2>Find the right care support</h2>
            </div>

            <form className="care-form" onSubmit={handleSubmit}>
              <div className="two-col">
                <label>
                  Full name
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </label>
              </div>

              <div className="two-col">
                <label>
                  Phone
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                  />
                </label>

                <label>
                  Postcode
                  <input
                    type="text"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleChange}
                    placeholder="e.g. SW1A 1AA"
                  />
                </label>
              </div>

              <div className="two-col">
                <label>
                  Care needed
                  <select name="careNeed" value={formData.careNeed} onChange={handleChange}>
                    {careOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Budget
                  <select name="budget" value={formData.budget} onChange={handleChange}>
                    <option>£20 - £40 per hour</option>
                    <option>£40 - £60 per hour</option>
                    <option>£60+ per hour</option>
                    <option>I am unsure</option>
                  </select>
                </label>
              </div>

              <label>
                Urgency
                <select name="urgency" value={formData.urgency} onChange={handleChange}>
                  <option>ASAP</option>
                  <option>Within 1 week</option>
                  <option>Within 2 weeks</option>
                  <option>Planning ahead</option>
                </select>
              </label>

              <label>
                Tell us about the care need
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Describe care requirements, routines, medical needs, and any preferences."
                  required
                />
              </label>

              {status.message ? (
                <div className={`status ${status.type}`} role="status">
                  {status.message}
                </div>
              ) : null}

              <button type="submit" className="button button-primary submit-button" disabled={status.type === 'pending'}>
                {status.type === 'pending' ? 'Submitting...' : 'Request a care match'}
              </button>
            </form>
          </div>
        </section>

        <section className="trust-bar container" aria-label="Trust indicators">
          <div>Verified providers</div>
          <div>Private care enquiries</div>
          <div>Fast matching</div>
          <div>Family-first process</div>
        </section>

        <section className="content-section container" id="how-it-works">
          <div className="section-heading">
            <span className="eyebrow">How it works</span>
            <h2>A Bark-style care marketplace designed for regulated care.</h2>
          </div>

          <div className="journey-grid">
            {journeySteps.map((step, index) => (
              <article className="info-card" key={step.title}>
                <div className="step-number">0{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section provider-section" id="for-families">
          <div className="container provider-inner">
            <div>
              <span className="eyebrow">For families</span>
              <h2> A simpler path to the right care provider.</h2>
              <p>
                Instead of calling multiple providers and repeating your story, families submit one
                request and receive a more focused, relevant introduction process.
              </p>
              <ul className="check-list">
                <li>One enquiry, multiple suitable providers</li>
                <li>Clearer matching by care type and location</li>
                <li>Faster path to assessment and service delivery</li>
              </ul>
            </div>

            <div className="highlight-box">
              <h3>Built for private care enquiries</h3>
              <p>
                This is designed around family needs, provider qualifications, and high-quality referral
                generation rather than agency-style operational complexity.
              </p>
            </div>
          </div>
        </section>

        <section className="content-section container" id="for-providers">
          <div className="section-heading narrow">
            <span className="eyebrow">For providers</span>
            <h2>Turn enquiries into care opportunities.</h2>
          </div>

          <div className="provider-grid">
            <div className="provider-copy">
              <p>
                3CS creates a referral network for care providers who want more qualified, relevant
                private-care enquiries without the need to build a large in-house sales team.
              </p>

              <ul className="check-list provider-benefits">
                {providerBenefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </div>

            <div className="pricing-card">
              <span className="mini-badge">Commercial model</span>
              <h3>Lead generation + referral network</h3>
              <div className="price-row">
                <strong>Membership</strong>
                <span>or per-qualified-lead pricing</span>
              </div>
              <p>
                Providers pay for access to live enquiries or premium visibility within the care network.
              </p>
            </div>
          </div>
        </section>

        <section className="content-section container faq-section" id="faq">
          <div className="section-heading narrow">
            <span className="eyebrow">FAQ</span>
            <h2>Questions founders often ask.</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq) => (
              <article className="faq-item" key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <div className="brand-name">3CS Care Services</div>
            <p>Independent care matching for families and verified providers.</p>
          </div>
          <a className="button button-primary" href="#enquiry-form">
            Request a care match
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
