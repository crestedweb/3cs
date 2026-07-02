import { useState, useEffect, useRef, useCallback } from "react";
import careBedMaking from "./assets/optimized/ChatGPT-Image-Jun-28-2026-06-14-29-PM.jpg";
import careMealSupport from "./assets/optimized/ChatGPT-Image-Jun-28-2026-06-14-47-PM.jpg";
import careCompanionship from "./assets/optimized/ChatGPT-Image-Jun-28-2026-06-15-05-PM.jpg";
import careMobility from "./assets/optimized/ChatGPT-Image-Jun-28-2026-06-15-18-PM.jpg";
import carePhoto5 from "./assets/optimized/ChatGPT-Image-Jun-28-2026-06-15-30-PM.jpg";
import carePhoto6 from "./assets/optimized/ChatGPT-Image-Jun-28-2026-06-15-41-PM.jpg";
import carePhoto7 from "./assets/optimized/ChatGPT-Image-Jun-28-2026-06-15-55-PM.jpg";
import carePhoto8 from "./assets/optimized/ChatGPT-Image-Jun-28-2026-06-16-08-PM.jpg";
import carePhoto9 from "./assets/optimized/ChatGPT-Image-Jun-28-2026-06-16-19-PM.jpg";

/* ─── DATA ─── */
const SERVICES = [
  { icon: "🏠", name: "Personal Care", desc: "Gentle daily support with bathing, dressing, and personal routines." },
  { icon: "🧠", name: "Dementia Care", desc: "Calm, familiar care that supports memory, safety, and dignity." },
  { icon: "🛏️", name: "Live-in Care", desc: "Round-the-clock support from a dedicated carer at home." },
  { icon: "🤝", name: "Companionship", desc: "Warm company and conversation to reduce loneliness." },
  { icon: "💊", name: "Medication Support", desc: "Reliable reminders and help with safe medication routines." },
  { icon: "🌙", name: "Respite Care", desc: "Short-term relief for families who need a well-earned break." },
  { icon: "🏡", name: "Domestic Support", desc: "Help with meals, light cleaning, laundry, and errands." },
  { icon: "🏥", name: "Hospital Discharge", desc: "Smooth support at home after a hospital stay." },
];

const CAREER_ROLES = [
  "Care Assistant",
  "Senior Care Assistant",
  "Live-in Carer",
  "Support Worker",
  "Weekend / Evening Carer",
];

const WHY = [
  { icon: "💙", title: "Person-Centred", body: "Every care plan is built around the individual — their preferences, routines, and life story." },
  { icon: "✅", title: "CQC Registered", body: "Registered and inspected by the Care Quality Commission. You're always in safe hands." },
  { icon: "🌟", title: "Trained Staff", body: "All carers complete rigorous training, DBS checks, and ongoing professional development." },
  { icon: "📋", title: "Bespoke Plans", body: "Flexible care plans that adapt as needs change over time." },
  { icon: "🕐", title: "24/7 Support", body: "Our team is available round the clock — families always have someone to call." },
  { icon: "❤️", title: "Family Values", body: "We treat every client as family — with warmth, patience, and respect." },
];

const TESTIMONIALS = [
  { name: "Margaret T.", role: "Daughter of client", stars: 5, text: "The carers from 3Cs have been absolutely wonderful with my mother. They treat her with so much dignity and warmth. I finally have peace of mind knowing she's in safe hands." },
  { name: "James O.", role: "Son of client", stars: 5, text: "From the very first assessment, the team was professional, caring, and thorough. The live-in care service has transformed my father's quality of life completely." },
  { name: "Patricia W.", role: "Client", stars: 5, text: "I was nervous about having carers come in, but they made me feel completely at ease. They respect my routine and always go the extra mile. Couldn't be happier." },
];

const POSTS = [
  { bg: "#0B1D3A", text: "We are here to care for your loved ones like family.", tag: "#3CsCares" },
  { bg: "#28A745", text: "Compassion is at the heart of everything we do.", tag: "Compassion · Care · Commitment" },
  { bg: "#0B1D3A", text: "Dementia Care — specialist support with patience, dignity, and understanding.", tag: "#DementiaCare" },
  { bg: "#28A745", text: "Quality care you can trust, delivered with kindness.", tag: "Compassion · Care · Commitment" },
];

const TEAM = [
  { name: "Precious Awe", role: "Managing Director", initials: "PA" },
  { name: "Mary Johnson", role: "Care Assistant", initials: "MJ" },
  { name: "Samuel Obi", role: "Senior Care Manager", initials: "SO" },
];

const STATS = [
  { target: 500, suffix: "+", label: "Clients Supported" },
  { target: 10, suffix: "+", label: "Years Experience" },
  { target: 50, suffix: "+", label: "Dedicated Carers" },
  { target: 98, suffix: "%", label: "Client Satisfaction" },
];

const NAV = ["Home", "About Us", "Our Services", "Why Choose Us", "Testimonials", "Contact"];

const IMAGES = {
  hero: careCompanionship,
  about: careMealSupport,
  cta: careMobility,
};

const GALLERY = [
  { src: careCompanionship, alt: "3Cs carer providing companionship at home", focus: "center" },
  { src: careMealSupport, alt: "3Cs carer supporting a client with a meal", focus: "center" },
  { src: careMobility, alt: "3Cs carer helping a client with mobility at home", focus: "center" },
  { src: careBedMaking, alt: "3Cs carer preparing a comfortable bedroom", focus: "center" },
  { src: carePhoto5, alt: "3Cs care service moment at home", focus: "center" },
  { src: carePhoto6, alt: "3Cs care service moment at home", focus: "center" },
  { src: carePhoto7, alt: "3Cs care service moment at home", focus: "center" },
  { src: carePhoto8, alt: "3Cs care service moment at home", focus: "center" },
  { src: carePhoto9, alt: "3Cs care service moment at home", focus: "center" },
];

const CARE_ACTION_NOTES = [
  {
    title: "Familiar routines, gentle pacing",
    body: "We keep the day steady and reassuring so each person can settle into care without feeling rushed or overwhelmed.",
  },
  {
    title: "Small moments that matter",
    body: "A warm meal, a made bed, or a calm conversation can do more than fill time. They help people feel seen and safe.",
  },
  {
    title: "Support shaped around home",
    body: "Every visit should feel like a natural part of the home, not a disruption to it. That is where trust starts to grow.",
  },
];

const CARE_ACTION_FEATURES = [
   {
    ...GALLERY[2],
    title: "Mobility support with confidence",
    body: "A steady hand and patient guidance for safer movement around the home.",
  },
  {
    ...GALLERY[1],
    title: "Mealtimes with dignity",
    body: "Practical help that keeps nutrition calm, respectful, and unhurried.",
  },
   {
    ...GALLERY[2],
    title: "Companionship that feels personal",
    body: "Friendly support that keeps conversation, confidence, and comfort close at hand.",
  },
  {
    ...GALLERY[3],
    title: "Comfort in the details",
    body: "A tidy room and thoughtful setup can make the whole day feel easier.",
  },
];

const FAQS = [
  {
    question: "What services does 3Cs Care Services provide?",
    answer:
      "3Cs Care Services provides professional, person-centred home care services that help individuals live safely and comfortably in their own homes. We offer Personal Care, Live-in Care, Companionship, Dementia Care, Medication Support, Domestic Support, Respite Care, Hospital Discharge Support, and more. Every care plan is tailored to each client.",
  },
  {
    question: "Can I contact someone outside normal business hours?",
    answer:
      "Yes. Our support team is available 24 hours a day, 7 days a week. Whether you have an urgent question or need immediate assistance, you can contact us at any time and one of our friendly team members will help.",
  },
  {
    question: "When should I consider full-time or live-in home care?",
    answer:
      "Live-in or continuous care may be the right choice if someone frequently wakes during the night, has difficulty walking, is at risk of falling, has recently been discharged from hospital, is living with dementia, or needs regular help with bathing, dressing, meals, or medication.",
    points: [
      "Frequent night-time waking or assistance needs",
      "Difficulty walking or increased fall risk",
      "Recent hospital discharge or recovery at home",
      "Dementia or another condition requiring regular supervision",
      "A family caregiver becoming physically or emotionally exhausted",
      "Help with bathing, dressing, meals, or medication",
    ],
  },
  {
    question: "How much do your home care services cost?",
    answer:
      "The cost depends on the type of service required, the number of care hours needed, and the level of support involved. We provide transparent pricing with no hidden charges, and we can recommend a care plan that suits your needs and budget.",
  },
  {
    question: "Do I have to sign a long-term contract?",
    answer:
      "No. Our services are flexible and built around your needs. You are not tied into a long-term contract, whether you need short-term support after hospital discharge or ongoing care.",
  },
  {
    question: "Are your services only for older adults?",
    answer:
      "No. While we specialise in supporting older adults, we also care for younger adults living with disabilities, people recovering from surgery, those with long-term health conditions, and anyone who needs extra support to stay independent at home.",
  },
  {
    question: "Will I have the same caregiver every time?",
    answer:
      "Consistency matters. Whenever possible, we assign the same caregiver or a small care team to each client. If your regular caregiver is unavailable, we provide another qualified caregiver who is fully briefed on the care plan.",
  },
  {
    question: "Are your caregivers qualified and background checked?",
    answer:
      "Absolutely. Every member of our care team goes through a thorough recruitment process, including background checks, reference verification, and relevant training. We select carers for both skill and compassion.",
  },
  {
    question: "Why choose 3Cs Care Services instead of hiring a private caregiver?",
    answer:
      "Choosing 3Cs Care Services gives you the confidence of working with a professional care provider. We carefully match clients with suitable caregivers, supervise quality, and provide responsive support so families can have peace of mind.",
  },
  {
    question: "How do I get started?",
    answer:
      "Getting started is simple. Contact us by phone, email, or through our website to arrange a free consultation. We’ll discuss your needs, answer your questions, and create a personalised care plan.",
  },
];

/* ─── GLOBAL CSS (mobile-first) ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Open+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
  body { font-family: 'Open Sans', sans-serif; overflow-x: hidden; }
  img  { max-width: 100%; display: block; }
  button { cursor: pointer; font-family: inherit; }

  /* ── Fade-in on scroll ── */
  .reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.2s; }
  .reveal-delay-3 { transition-delay: 0.3s; }
  .reveal-delay-4 { transition-delay: 0.4s; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    border: none; border-radius: 6px;
    font-family: 'Open Sans', sans-serif; font-weight: 700;
    font-size: 0.95rem; letter-spacing: 0.02em;
    padding: 14px 24px; width: 100%; text-align: center;
    transition: background 0.2s, transform 0.15s, color 0.2s, box-shadow 0.2s;
    text-decoration: none; gap: 8px;
  }
  .btn-green { background: #28A745; color: #fff; }
  .btn-green:hover { background: #1e8c38; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(40,167,69,0.35); }
  .btn-navy  { background: #0B1D3A; color: #fff; }
  .btn-navy:hover  { background: #0d2448; transform: translateY(-2px); }
  .btn-ghost-white { background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.7); }
  .btn-ghost-white:hover { background: #fff; color: #0B1D3A; }
  .btn-ghost-green { background: transparent; color: #28A745; border: 2px solid #28A745; }
  .btn-ghost-green:hover { background: #28A745; color: #fff; }
  .whatsapp-fab {
    position: fixed;
    right: 16px;
    bottom: 18px;
    z-index: 320;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    padding: 0;
    border-radius: 50%;
    background: #28A745;
    color: #fff;
    text-decoration: none;
    box-shadow: 0 10px 24px rgba(37, 211, 102, 0.34);
    border: 3px solid #fff;
    transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  }
  .whatsapp-fab:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 30px rgba(37, 211, 102, 0.42);
    filter: brightness(1.02);
  }
  .whatsapp-fab-icon {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }
  .whatsapp-fab-icon svg { width: 100%; height: 100%; display: block; }

  /* ── Labels & headings ── */
  .label {
    display: inline-block; color: #28A745; font-weight: 700;
    font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 8px;
  }
  .sec-h2 {
    font-family: 'Montserrat', sans-serif; font-weight: 800;
    font-size: clamp(1.65rem, 6vw, 2.6rem); color: #0B1D3A;
    line-height: 1.15; letter-spacing: -0.01em;
  }
  .sec-h2-white { color: #fff !important; }
  .sec { padding: 60px 20px; }
  .sec-wide { max-width: 1200px; margin-inline: auto; }
  .sec-narrow { max-width: 700px; margin-inline: auto; }
  .text-center { text-align: center; }

  /* ── Top bar ── */
  .topbar {
    background: #060f1e; color: #7a9bbf;
    font-size: 0.76rem; padding: 8px 20px;
    display: none; justify-content: space-between; flex-wrap: wrap; gap: 6px;
  }
  .topbar a { color: #4cde6e; text-decoration: none; }

  /* ── Nav ── */
  .nav-wrap {
    position: sticky; top: 0; z-index: 300;
    background: #0B1D3A;
    transition: box-shadow 0.3s, background 0.3s;
  }
  .nav-wrap.scrolled { box-shadow: 0 2px 24px rgba(0,0,0,0.4); background: rgba(11,29,58,0.97); backdrop-filter: blur(10px); }
  .nav-inner {
    max-width: 1200px; margin-inline: auto;
    padding: 0 20px; height: 64px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .mobile-primary-cta, .mobile-care-search { display: none; }
  .nav-desktop { display: none; align-items: center; gap: 20px; }
  .nav-desktop a {
    color: #c8d8ec; font-size: 0.84rem; font-weight: 600;
    text-decoration: none; padding: 4px 2px;
    border-bottom: 2px solid transparent;
    transition: border-color 0.2s, color 0.2s;
  }
  .nav-desktop a:hover, .nav-desktop a.active { color: #fff; border-bottom-color: #28A745; }
  .ham { background: none; border: none; color: #fff; font-size: 1.6rem; line-height: 1; padding: 6px; border-radius: 4px; transition: background 0.2s; }
  .ham:hover { background: rgba(255,255,255,0.08); }
  .care-search-icon { color: #28A745; font-size: 1.1rem; line-height: 1; flex: 0 0 auto; }
  .care-search-input {
    min-width: 0; flex: 1 1 auto; border: 0; outline: 0;
    background: transparent; color: #fff; font: 600 0.9rem 'Open Sans', sans-serif;
  }
  .care-search-input::placeholder { color: rgba(255,255,255,0.58); }
  .care-search-btn {
    border: 0; border-radius: 999px; background: #fff; color: #0B1D3A;
    font-weight: 800; font-size: 0.82rem; padding: 10px 18px; white-space: nowrap;
  }
  .care-search-msg {
    display: none; color: rgba(255,255,255,0.76); font-size: 0.72rem;
    padding: 0 14px 12px; margin-top: -8px;
  }
  .care-search-msg.error { color: #ffffff; }
  .mob-menu {
    background: #060f1e; padding: 12px 20px 28px;
    border-top: 1px solid rgba(255,255,255,0.07);
    animation: slideDown 0.25s ease;
  }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .mob-menu a {
    display: block; color: #c8d8ec; font-size: 1rem; font-weight: 600;
    text-decoration: none; padding: 14px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    transition: color 0.2s, padding-left 0.2s;
  }
  .mob-menu a:hover { color: #4cde6e; padding-left: 8px; }

  /* ── Hero ── */
  .hero {
    background: linear-gradient(160deg, #0B1D3A 0%, #0e2648 65%, #0B1D3A 100%);
    padding: 56px 20px 0; overflow: hidden; position: relative;
  }
  .hero::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at 75% 40%, rgba(40,167,69,0.07) 0%, transparent 55%);
    pointer-events: none;
  }
  .hero-badge {
    display: inline-block;
    background: rgba(40,167,69,0.14); color: #4cde6e;
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em;
    padding: 5px 14px; border-radius: 100px;
    border: 1px solid rgba(40,167,69,0.28); margin-bottom: 20px;
  }
  .hero-h1 {
    font-family: 'Montserrat', sans-serif; font-weight: 900;
    font-size: clamp(2rem, 8vw, 3.5rem); color: #fff;
    line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 20px;
  }
  .hero-p { color: #b3c6e0; font-size: 1rem; line-height: 1.78; margin-bottom: 32px; max-width: 500px; }
  .hero-btns { display: flex; flex-direction: column; gap: 12px; margin-bottom: 44px; }
  .hero-trust { display: flex; align-items: center; gap: 10px; margin-bottom: 40px; }
  .hero-trust-text { color: #7a9bbf; font-size: 0.8rem; line-height: 1.4; }
  .hero-trust-text strong { color: #4cde6e; display: block; }
  .hero-img-wrap {
    position: relative; border-radius: 16px 16px 0 0; overflow: hidden;
    max-width: 520px; margin-inline: auto;
    box-shadow: 0 -8px 48px rgba(0,0,0,0.4);
  }
  .hero-img-wrap img { width: 100%; height: 280px; object-fit: cover; }
  .hero-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 50%, rgba(11,29,58,0.6) 100%);
  }
  .hero-cert-badge {
    position: absolute; top: 20px; left: 20px; background: #28A745; color: #fff;
    padding: 8px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 700;
    box-shadow: 0 4px 12px rgba(40,167,69,0.4);
  }

  /* ── Stats ── */
  .stats-bg { background: #fff; padding: 44px 20px 52px; }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px 20px; }
  .stat-n { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: 2.4rem; color: #0B1D3A; line-height: 1; }
  .stat-l { color: #28A745; font-weight: 700; font-size: 0.76rem; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 5px; }

  /* ── Service cards ── */
  .srv-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .srv-card {
    background: #fff; border: 1px solid #e8edf4; border-top: 3px solid #0B1D3A;
    border-radius: 24px 24px 22px 22px;
    padding: 24px 22px 22px; position: relative; overflow: hidden;
    box-shadow: 0 16px 32px rgba(11,29,58,0.05);
    transition: box-shadow 0.28s, transform 0.28s, border-color 0.28s;
    cursor: default;
  }
  .srv-card::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: 2px; background: linear-gradient(90deg, #0B1D3A, #4cde6e);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.3s ease;
  }
  .srv-card:hover { box-shadow: 0 18px 36px rgba(11,29,58,0.1); transform: translateY(-4px); border-color: #0B1D3A; }
  .srv-card:hover::after { transform: scaleX(1); }
  .srv-card:hover .srv-more { opacity: 1; transform: translateY(0); }
  .srv-icon {
    width: 40px; height: 40px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    background: #f3f7fb; box-shadow: inset 0 0 0 1px rgba(11,29,58,0.14);
    font-size: 1.3rem; margin-bottom: 14px;
  }
  .srv-name { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 1.03rem; line-height: 1.15; color: #0B1D3A; margin-bottom: 10px; }
  .srv-desc { color: #5a6a7e; font-size: 0.86rem; line-height: 1.6; min-height: 2.7em; }
  .srv-more {
    display: inline-block; margin-top: 12px; color: #28A745;
    font-weight: 700; font-size: 0.8rem; letter-spacing: 0.04em;
    opacity: 0; transform: translateY(6px); transition: opacity 0.25s, transform 0.25s;
  }
  .service-proof {
    display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;
    margin-top: 28px;
  }
  .service-proof span {
    background: #FFFFFF; color: #0B1D3A; border: 1px solid #e8edf4;
    border-left: 3px solid #28A745; border-radius: 8px;
    padding: 10px 14px; font-weight: 800; font-size: 0.78rem;
  }

  /* ── Care gallery ── */
  .care-layout { display: grid; grid-template-columns: 1fr; gap: 28px; align-items: start; }
  .care-story {
    background: linear-gradient(180deg, #f7fafc 0%, #ffffff 100%);
    border: 1px solid #e6edf5;
    border-radius: 20px;
    padding: 24px 20px;
    box-shadow: 0 12px 34px rgba(11,29,58,0.06);
  }
  .care-story h3 {
    font-family: 'Montserrat', sans-serif;
    color: #0B1D3A;
    font-weight: 900;
    font-size: 1.45rem;
    line-height: 1.15;
    margin-top: 8px;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }
  .care-story > p { color: #556779; line-height: 1.7; margin-bottom: 18px; }
  .care-notes { display: grid; gap: 14px; }
  .care-note { display: flex; gap: 12px; align-items: flex-start; }
  .care-note-dot {
    width: 11px; height: 11px; border-radius: 999px; margin-top: 7px;
    background: linear-gradient(135deg, #0B1D3A, #28A745);
    box-shadow: 0 0 0 6px rgba(40,167,69,0.08);
    flex: 0 0 auto;
  }
  .care-note h4 {
    color: #0B1D3A; font-family: 'Montserrat', sans-serif; font-size: 0.98rem;
    font-weight: 800; margin-bottom: 4px;
  }
  .care-note p { color: #627082; font-size: 0.89rem; line-height: 1.6; }
  .care-gallery {
    position: relative;
    display: flex;
    gap: 0;
    min-height: 0;
    overflow: hidden;
  }
  .care-gallery > .reveal {
    flex: 0 0 100%;
    min-width: 100%;
    transition: transform 0.45s ease;
    transform: translateX(calc(var(--care-slide, 0) * -100%));
  }
  .care-mobile-bullets { display: none; }
  .care-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 18px;
  }
  .care-dot {
    width: 9px;
    height: 9px;
    border: 0;
    border-radius: 999px;
    background: rgba(11,29,58,0.18);
    padding: 0;
  }
  .care-dot.active { background: #0B1D3A; transform: scale(1.18); }
  .care-photo {
    position: relative;
    opacity: 1;
    overflow: hidden;
    border-radius: 18px;
    height: min(72vw, 310px);
    min-height: 250px;
    background: #e8eef5;
    box-shadow: 0 14px 34px rgba(11,29,58,0.10);
    transition: opacity 0.4s ease;
    pointer-events: auto;
  }
  .care-photo img {
    width: 100%; height: 100%; min-height: 100%; object-fit: cover;
    object-position: var(--focus, center); transition: transform 0.35s ease;
  }
  .care-photo:hover img { transform: scale(1.035); }
  .care-caption {
    position: absolute; left: 0; right: 0; bottom: 0;
    padding: 18px 16px 16px;
    background: linear-gradient(to top, rgba(11,29,58,0.88), rgba(11,29,58,0.10));
    color: #fff;
  }
  .care-kicker {
    display: inline-block; font-size: 0.72rem; letter-spacing: 0.08em;
    text-transform: uppercase; color: rgba(255,255,255,0.78); margin-bottom: 6px;
  }
  .care-caption h4 {
    font-family: 'Montserrat', sans-serif; font-size: 1rem; line-height: 1.2;
    margin-bottom: 5px; font-weight: 800;
  }
  .care-caption p { color: rgba(255,255,255,0.82); font-size: 0.86rem; line-height: 1.55; }

  /* ── FAQ ── */
  .faq-section { background: #f5f7fa; }
  .faq-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .faq-item {
    background: #fff;
    border: 1px solid #e4ecf6;
    border-radius: 16px;
    box-shadow: 0 10px 28px rgba(11,29,58,0.05);
    overflow: hidden;
  }
  .faq-item[open] {
    border-color: rgba(40,167,69,0.26);
    box-shadow: 0 14px 32px rgba(11,29,58,0.08);
  }
  .faq-q {
    list-style: none;
    cursor: pointer;
    padding: 18px 18px 18px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    justify-content: space-between;
    color: #0B1D3A;
    font-family: 'Montserrat', sans-serif;
    font-weight: 800;
    font-size: 0.98rem;
    line-height: 1.35;
  }
  .faq-q::-webkit-details-marker { display: none; }
  .faq-q-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(40,167,69,0.12);
    color: #28A745;
    font-size: 1rem;
    font-weight: 800;
    transition: transform 0.2s ease, background 0.2s ease;
  }
  .faq-item[open] .faq-q-icon {
    transform: rotate(45deg);
    background: rgba(40,167,69,0.18);
  }
  .faq-a {
    padding: 0 18px 18px;
    color: #5a6a7e;
    line-height: 1.75;
    font-size: 0.94rem;
  }
  .faq-a p + p { margin-top: 12px; }
  .faq-list {
    margin: 12px 0 0;
    padding-left: 18px;
    display: grid;
    gap: 8px;
  }
  .faq-list li { color: #5a6a7e; }

  /* ── Why cards ── */
  .why-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
  .why-card {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 22px 20px;
    transition: background 0.22s, border-color 0.22s, transform 0.22s;
  }
  .why-card:hover { background: rgba(40,167,69,0.1); border-color: rgba(40,167,69,0.3); transform: translateY(-3px); }
  .why-icon { font-size: 1.8rem; margin-bottom: 10px; }
  .why-title { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #fff; font-size: 0.95rem; margin-bottom: 6px; }
  .why-body { color: #b3c6e0; font-size: 0.855rem; line-height: 1.65; }

  /* ── About ── */
  .about-inner { display: grid; grid-template-columns: 1fr; gap: 40px; }
  .about-img-wrap { position: relative; border-radius: 16px; overflow: hidden; }
  .about-img-wrap img { width: 100%; height: 320px; object-fit: cover; }
  .about-badge {
    position: absolute; bottom: 20px; left: 20px;
    background: #28A745; color: #fff;
    padding: 12px 18px; border-radius: 10px;
    font-family: 'Montserrat', sans-serif; font-weight: 800;
    font-size: 0.85rem; line-height: 1.3;
    box-shadow: 0 4px 16px rgba(40,167,69,0.4);
  }
  .about-badge span { font-size: 1.5rem; display: block; font-weight: 900; }
  .check-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
  .check-dot { width: 22px; height: 22px; border-radius: 50%; background: #28A745; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.65rem; font-weight: 900; margin-top: 1px; }
  .check-text { color: #0B1D3A; font-weight: 600; font-size: 0.9rem; line-height: 1.5; }

  /* ── Testimonials ── */
  .testi-grid { display: grid; grid-template-columns: 1fr; gap: 34px; align-items: start; }
  .testi-card {
    --note-bg: #ffe178;
    --note-shadow: rgba(11,29,58,0.18);
    background:
      linear-gradient(135deg, transparent 0 78%, rgba(0,0,0,0.12) 78% 84%, transparent 84%),
      var(--note-bg);
    border-radius: 3px 3px 30px 3px;
    padding: 42px 28px 30px;
    position: relative;
    min-height: 260px;
    box-shadow: 0 18px 26px var(--note-shadow);
    transform: rotate(-1.8deg);
    transition: box-shadow 0.25s, transform 0.25s;
  }
  .testi-card.note-2 { --note-bg: #f8c6bd; transform: rotate(1.4deg); }
  .testi-card.note-3 { --note-bg: #dcefd2; transform: rotate(-0.8deg); }
  .testi-card:hover { box-shadow: 0 22px 34px rgba(11,29,58,0.2); transform: translateY(-3px) rotate(0deg); }
  .testi-card::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    width: 42%;
    height: 42%;
    border-radius: 0 0 30px 0;
    background: linear-gradient(135deg, transparent 52%, rgba(11,29,58,0.13) 53%, rgba(11,29,58,0.2) 100%);
    pointer-events: none;
  }
  .testi-tape {
    position: absolute;
    top: -16px;
    left: 50%;
    width: 96px;
    height: 28px;
    transform: translateX(-50%) rotate(-4deg);
    background: rgba(245,239,189,0.78);
    box-shadow: 0 2px 6px rgba(11,29,58,0.12);
    opacity: 0.9;
  }
  .testi-pin {
    position: absolute;
    top: -13px;
    left: 24px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #ff6f6f 0 24%, #c9162e 25% 72%, #8d1020 73% 100%);
    box-shadow: 0 6px 8px rgba(11,29,58,0.22);
  }
  .testi-pin::after {
    content: '';
    position: absolute;
    left: 12px;
    top: 18px;
    width: 2px;
    height: 24px;
    background: rgba(11,29,58,0.3);
    transform: rotate(18deg);
    transform-origin: top;
  }
  .testi-stars { color: #0B1D3A; font-size: 0.78rem; letter-spacing: 1px; margin-bottom: 14px; opacity: 0.55; }
  .testi-text {
    color: #27364a;
    font-family: 'Comic Sans MS', 'Segoe Print', cursive;
    font-size: 0.96rem;
    line-height: 1.55;
    margin-bottom: 22px;
  }
  .testi-name { font-family: 'Montserrat', sans-serif; font-weight: 800; color: #0B1D3A; font-size: 0.9rem; }
  .testi-role { color: #36526f; font-size: 0.78rem; font-weight: 700; margin-top: 3px; }
  .testi-quote { display: none; }

  /* ── Social posts ── */
  .posts-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .post-card { border-radius: 12px; padding: 28px 24px; display: flex; flex-direction: column; min-height: 190px; transition: transform 0.25s; }
  .post-card:hover { transform: translateY(-4px); }
  .post-quote { font-size: 2.4rem; color: rgba(255,255,255,0.2); font-family: serif; line-height: 1; margin-bottom: 10px; }
  .post-text { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #fff; font-size: 0.97rem; line-height: 1.45; flex: 1; }
  .post-footer { margin-top: 20px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; gap: 8px; }
  .post-tag { color: rgba(255,255,255,0.65); font-size: 0.72rem; font-weight: 700; }

  /* ── Team ── */
  .team-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
  .team-card { text-align: center; padding: 36px 24px; border: 1px solid #e4ecf6; border-radius: 14px; transition: box-shadow 0.25s, transform 0.25s; }
  .team-card:hover { box-shadow: 0 10px 28px rgba(11,29,58,0.1); transform: translateY(-4px); }
  .avatar { width: 76px; height: 76px; border-radius: 50%; background: linear-gradient(135deg, #0B1D3A, #28A745); margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: 1.4rem; color: #fff; }
  .t-name { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 1rem; color: #0B1D3A; margin-bottom: 4px; }
  .t-role { color: #28A745; font-weight: 600; font-size: 0.82rem; }

  /* ── CTA strip ── */
  .cta-strip { position: relative; overflow: hidden; }
  .cta-strip img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.22); }
  .cta-inner { position: relative; z-index: 1; padding: 64px 20px; text-align: center; }
  .cta-btns { display: flex; flex-direction: column; gap: 14px; margin-top: 28px; }

  /* ── Contact ── */
  .contact-grid { display: grid; grid-template-columns: 1fr; gap: 36px; }
  .ci-item { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px; }
  .ci-icon { width: 42px; height: 42px; border-radius: 10px; background: linear-gradient(135deg, #0B1D3A, #0e2e5c); display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; box-shadow: 0 4px 12px rgba(11,29,58,0.2); }
  .ci-label { color: #28A745; font-weight: 700; font-size: 0.72rem; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 2px; }
  .ci-val { color: #0B1D3A; font-weight: 500; font-size: 0.88rem; }
  .form-box { background: #fff; border-radius: 16px; padding: 28px 20px; box-shadow: 0 8px 40px rgba(11,29,58,0.1); border: 1px solid #e8f0f8; }
  #contact-form, #careers-apply { scroll-margin-top: 112px; }
  .finput {
    width: 100%; padding: 13px 14px; margin-bottom: 14px;
    border: 1.5px solid #dde6f0; border-radius: 8px;
    font-family: 'Open Sans', sans-serif; font-size: 0.9rem; color: #0B1D3A;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    -webkit-appearance: none; background: #fafcff;
  }
  .finput:focus { border-color: #28A745; box-shadow: 0 0 0 3px rgba(40,167,69,0.1); background: #fff; }
  .finput::placeholder { color: #a0afc0; }
  .form-grid-2 { display: grid; grid-template-columns: 1fr; gap: 0; }
  .check-row {
    display: flex; gap: 10px; align-items: flex-start; color: #0B1D3A;
    font-size: 0.86rem; font-weight: 700; margin: 0 0 12px;
  }
  .check-row input { accent-color: #28A745; margin-top: 3px; }
  .careers-panel {
    display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start;
  }
  .career-list { display: grid; gap: 12px; margin-top: 22px; }
  .career-list div {
    background: #FFFFFF; border: 1px solid #e8edf4; border-left: 4px solid #28A745;
    color: #0B1D3A; border-radius: 8px; padding: 14px 16px; font-weight: 800;
  }
  .career-note {
    background: #F5F7FA; border: 1px solid #e8edf4; border-radius: 8px;
    padding: 16px; color: #0B1D3A; line-height: 1.65; font-size: 0.92rem;
  }

  /* ── Social icons ── */
  .social-links { display: flex; gap: 12px; margin-top: 16px; }
  .soc-icon {
    width: 38px; height: 38px; border-radius: 8px;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    color: #c8d8ec; text-decoration: none; font-size: 0.85rem; font-weight: 700;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }
  .soc-icon:hover { background: #28A745; color: #fff; border-color: #28A745; }

  /* ── Footer ── */
  .foot-grid { display: grid; grid-template-columns: 1fr; gap: 32px; margin-bottom: 36px; }
  .foot-link { display: block; color: #8aaac8; font-size: 0.875rem; text-decoration: none; margin-bottom: 10px; transition: color 0.2s, padding-left 0.2s; }
  .foot-link:hover { color: #4cde6e; padding-left: 4px; }

  /* ── Back to top ── */
  .btt {
    position: fixed; bottom: 24px; right: 20px; z-index: 400;
    width: 46px; height: 46px; border-radius: 50%;
    background: #28A745; color: #fff; border: none;
    font-size: 1.2rem; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(40,167,69,0.45);
    transition: opacity 0.3s, transform 0.3s;
    cursor: pointer;
  }
  .btt:hover { transform: translateY(-3px); background: #1e8c38; }
  .btt.hidden { opacity: 0; pointer-events: none; transform: translateY(16px); }

  /* Active nav indicator */
  .nav-indicator {
    display: inline-block; width: 6px; height: 6px; border-radius: 50%;
    background: #28A745; margin-left: 6px; vertical-align: middle;
  }

  /* ── Tablet 600px+ ── */
  @media (min-width: 600px) {
    .topbar { display: flex; }
    .sec { padding: 72px 32px; }
    .btn { width: auto; }
    .hero-btns { flex-direction: row; flex-wrap: wrap; }
    .cta-btns { flex-direction: row; justify-content: center; }
    .stats-grid { grid-template-columns: repeat(4, 1fr); }
    .srv-grid  { grid-template-columns: repeat(2, 1fr); }
    .care-layout { grid-template-columns: 0.92fr 1.08fr; gap: 20px; align-items: stretch; }
    .care-story { padding: 28px 24px; }
    .care-gallery {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      overflow: visible;
    }
    .care-gallery > .reveal {
      min-width: 0;
      transform: none;
    }
    .care-photo,
    .care-photo.feature { height: 260px; min-height: 260px; }
    .care-dots { display: none; }
    .faq-grid { gap: 14px; }
    .faq-q { padding: 20px 22px; font-size: 1.02rem; }
    .faq-a { padding: 0 22px 20px; font-size: 0.96rem; }
    .why-grid  { grid-template-columns: repeat(2, 1fr); }
    .posts-grid { grid-template-columns: repeat(2, 1fr); }
    .testi-grid { grid-template-columns: repeat(2, 1fr); gap: 34px 22px; }
    .team-grid { grid-template-columns: repeat(3, 1fr); }
    .contact-grid { gap: 48px; }
    .foot-grid { grid-template-columns: repeat(2, 1fr); }
    .form-box { padding: 36px 32px; }
    .form-grid-2 { grid-template-columns: 1fr 1fr; gap: 0 14px; }
    .hero-img-wrap img { height: 340px; }
  }

  @media (max-width: 599px) {
    .nav-wrap { background: #0B1D3A; }
    .nav-inner {
      height: auto; min-height: 82px; padding: 16px 14px 14px; gap: 10px;
    }
    .nav-inner > div:first-child { min-width: 0; }
    .nav-inner > div:first-child svg { width: 34px; height: 34px; }
    .nav-inner > div:first-child div div:first-child { font-size: 1.08rem !important; }
    .nav-inner > div:first-child div div:first-child span { font-size: 1.34rem !important; }
    .nav-inner > div:first-child div div:last-child { font-size: 0.4rem !important; }
    .mobile-primary-cta {
      display: inline-flex; align-items: center; justify-content: center;
      border: 0; border-radius: 999px; background: #28A745; color: #fff;
      font-weight: 800; font-size: 0.82rem; line-height: 1.15;
      padding: 12px 18px; min-width: 112px; box-shadow: 0 8px 22px rgba(40,167,69,0.26);
    }
    .ham {
      width: 46px; height: 46px; border-radius: 50%; background: #fff; color: #0B1D3A;
      display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto;
      font-size: 1.35rem;
    }
    .mobile-care-search {
      display: flex; align-items: center; gap: 10px;
      padding: 0 14px 14px; max-width: 1200px; margin-inline: auto;
    }
    .care-search-msg { display: block; }
    .care-search-field {
      min-width: 0; flex: 1 1 auto; height: 42px; display: flex; align-items: center; gap: 9px;
    }
    #our-services.sec { padding-inline: 16px; }
    .srv-grid { max-width: 360px; margin-inline: auto; gap: 12px; }
    .srv-card { padding: 18px 16px 16px; border-radius: 14px; box-shadow: 0 10px 22px rgba(11,29,58,0.055); }
    .srv-icon { width: 34px; height: 34px; font-size: 1.05rem; margin-bottom: 10px; }
    .srv-name { font-size: 0.96rem; margin-bottom: 7px; }
    .srv-desc { font-size: 0.82rem; line-height: 1.5; min-height: 0; }
    .srv-more { opacity: 1; transform: none; margin-top: 8px; }
    .service-proof { max-width: 360px; margin-inline: auto; margin-top: 22px; justify-content: stretch; }
    .service-proof span { flex: 1 1 100%; text-align: center; }
    .hero { padding: 0; background: #0B1D3A; }
    .hero::before { display: none; }
    .hero-layout { display: flex; flex-direction: column-reverse; }
    .hero-text {
      padding: 26px 20px 38px; background: linear-gradient(180deg, #0B1D3A 0%, #0d2448 100%);
    }
    .hero-badge { margin-bottom: 14px; }
    .hero-h1 { font-size: clamp(1.78rem, 8vw, 2.35rem); margin-bottom: 14px; }
    .hero-p { font-size: 0.94rem; line-height: 1.65; margin-bottom: 22px; }
    .hero-btns { margin-bottom: 24px; }
    .hero-img-wrap {
      width: 100%; max-width: none; border-radius: 0; box-shadow: none; margin: 0;
    }
    .hero-img-wrap img { height: 250px; object-position: center; }
    .about-img-wrap img { object-position: center; }
    .cta-strip img { object-position: center; }
    .hero-cert-badge {
      top: auto; left: 14px; bottom: 14px;
      padding: 7px 11px; font-size: 0.72rem;
    }
    .hero-img-overlay { background: linear-gradient(to top, rgba(11,29,58,0.24), transparent 54%); }
    .testi-grid {
      justify-items: center;
      gap: 42px;
    }
    .testi-card {
      width: min(82vw, 310px);
      min-height: 245px;
      padding: 38px 24px 28px;
    }
    .testi-text {
      font-size: 0.9rem;
      line-height: 1.5;
    }
    .care-layout { gap: 18px; }
    .care-story {
      padding: 22px 18px;
      border-radius: 18px;
    }
    .care-story h3 { font-size: 1.22rem; }
    .care-story > p { font-size: 0.92rem; line-height: 1.62; margin-bottom: 14px; }
    .care-notes { display: none; }
    .care-mobile-bullets {
      display: grid;
      gap: 10px;
      margin-top: 6px;
      padding-left: 0;
    }
    .care-mobile-bullets li {
      list-style: none;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      color: #39495d;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    .care-mobile-bullets li::before {
      content: '';
      width: 9px;
      height: 9px;
      margin-top: 0.45rem;
      border-radius: 999px;
      background: linear-gradient(135deg, #0B1D3A, #28A745);
      box-shadow: 0 0 0 5px rgba(40,167,69,0.08);
      flex: 0 0 auto;
    }
    .care-photo { height: min(76vw, 295px); min-height: 250px; }
    .care-caption { padding: 14px 14px 13px; }
    .care-caption h4 { font-size: 0.92rem; }
    .care-caption p { font-size: 0.8rem; line-height: 1.45; }
    .care-dots { margin-top: 14px; }
    .hero > svg { display: none !important; }
    .whatsapp-fab {
      right: 14px;
      bottom: 14px;
      width: 54px;
      height: 54px;
    }
    .whatsapp-fab-icon {
      width: 40px;
      height: 40px;
      font-size: 1.2rem;
    }
    .btt {
      right: 14px;
      bottom: 78px;
      width: 44px;
      height: 44px;
      font-size: 1.1rem;
    }
  }

  /* ── Desktop 900px+ ── */
  @media (min-width: 900px) {
    .sec { padding: 88px 40px; }
    .topbar { padding: 8px 40px; }
    .nav-inner { height: 72px; padding: 0 40px; }
    .ham { display: none; }
    .nav-desktop { display: flex; }
    .hero { padding: 80px 40px 0; }
    .hero-layout { display: flex; align-items: center; gap: 56px; }
    .hero-text { flex: 1 1 480px; }
    .hero-visual { flex: 1 1 400px; }
    .hero-img-wrap img { height: 440px; }
    .srv-grid { grid-template-columns: repeat(4, 1fr); }
    .care-layout { grid-template-columns: 0.9fr 1.1fr; gap: 28px; }
    .care-gallery {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-content: start;
      gap: 16px;
      overflow: visible;
    }
    .care-gallery > .reveal {
      min-width: 0;
      transform: none;
    }
    .care-photo,
    .care-photo.feature { height: 250px; min-height: 250px; }
    .faq-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .why-grid { grid-template-columns: repeat(3, 1fr); }
    .posts-grid { grid-template-columns: repeat(4, 1fr); }
    .testi-grid { grid-template-columns: repeat(3, 1fr); gap: 30px; }
    .about-inner { grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
    .about-img-wrap img { height: 420px; }
    .contact-grid { grid-template-columns: 1fr 1fr; gap: 64px; }
    .careers-panel { grid-template-columns: 0.85fr 1.15fr; gap: 42px; }
    .foot-grid { grid-template-columns: 2fr 1fr 1fr; }
    .whatsapp-fab {
      right: 24px;
      bottom: 24px;
      width: 58px;
      height: 58px;
    }
  }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .reveal { opacity: 1 !important; transform: none !important; } * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
`;

/* ─── LOGO ─── */
function Logo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#0B1D3A" stroke="#28A745" strokeWidth="3"/>
      <circle cx="36" cy="28" r="9" fill="#fff"/>
      <circle cx="64" cy="28" r="9" fill="#28A745"/>
      <path d="M30 68 L30 82 L44 82 L44 68 Z" fill="#fff"/>
      <path d="M56 68 L56 82 L70 82 L70 68 Z" fill="#fff"/>
      <polygon points="24,70 50,50 76,70" fill="#28A745"/>
      <path d="M20 66 L50 44 L80 66" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function BrandName() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Logo size={42}/>
      <div>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "1.35rem", color: "#fff", lineHeight: 1 }}>
          3C<span style={{ color: "#28A745", fontSize: "1.7rem" }}>s</span>
        </div>
        <div style={{ fontSize: "0.49rem", color: "#8aaac8", letterSpacing: "0.18em", fontWeight: 700, lineHeight: 1.3 }}>
          CARE SERVICES<br/>LIMITED
        </div>
      </div>
    </div>
  );
}

/* ─── ANIMATED COUNTER ─── */
function Counter({ target, suffix, label, visible }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const duration = 1800;
    const steps = 60;
    const inc = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [visible, target]);

  return (
    <div style={{ textAlign: "center" }}>
      <div className="stat-n">{count}{suffix}</div>
      <div className="stat-l">{label}</div>
    </div>
  );
}

/* ─── REVEAL HOOK ─── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ─── REVEAL WRAPPER ─── */
function Reveal({ children, delay = 0, style }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`reveal${visible ? " visible" : ""}${delay ? ` reveal-delay-${delay}` : ""}`} style={style}>
      {children}
    </div>
  );
}

/* ─── CONTACT FORM ─── */
function ContactForm({ initialPostcode = "" }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", postcode: initialPostcode, service: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    if (!initialPostcode) return;
    setForm(f => ({
      ...f,
      postcode: initialPostcode,
      message: f.message || `Postcode: ${initialPostcode}\nCare needs: `,
    }));
  }, [initialPostcode]);

  const buildMailtoHref = () => {
    const subject = encodeURIComponent(`New website enquiry from ${form.name || "Website visitor"}`);
    const body = encodeURIComponent([
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone || "Not provided"}`,
      `Postcode: ${form.postcode || "Not provided"}`,
      `Service: ${form.service || "Not selected"}`,
      "",
      "Message:",
      form.message,
    ].join("\n"));

    return `mailto:info@3cscareservices.co.uk?subject=${subject}&body=${body}`;
  };

  const fallbackToEmailClient = () => {
    if (typeof window === "undefined") return false;
    window.location.href = buildMailtoHref();
    return true;
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { error: await response.text() };

      if (!response.ok) {
        throw new Error(
        data.details ? `${data.error || "Failed to send message"}: ${data.details}` : (data.error || "Failed to send message")
        );
      }

      setSent(true);
    } catch (err) {
      const message = String(err?.message || "");
      const canFallback =
        message.includes("ECONNREFUSED") ||
        message.includes("Failed to fetch") ||
        message.includes("NetworkError") ||
        message.includes("proxy error");

      if (canFallback && fallbackToEmailClient()) {
        setSent(true);
        return;
      }

      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(40,167,69,0.1)", border: "2px solid #28A745", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "1.8rem" }}>✅</div>
      <h3 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, color: "#0B1D3A", marginBottom: 10 }}>Message Sent!</h3>
      <p style={{ color: "#5a6a7e", marginBottom: 24, lineHeight: 1.7 }}>We'll be in touch within 24 hours to discuss your care needs.</p>
      <button className="btn btn-ghost-green" onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", postcode: initialPostcode, service: "", message: "" }); }} style={{ width: "auto", padding: "12px 28px" }}>Send Another</button>
    </div>
  );

  return (
    <div>
      {[
        { name: "name", ph: "Your Full Name *", type: "text" },
        { name: "email", ph: "Email Address *", type: "email" },
        { name: "phone", ph: "Phone Number", type: "tel" },
        { name: "postcode", ph: "Postcode", type: "text" },
      ].map(f => (
        <input key={f.name} className="finput" name={f.name} type={f.type} placeholder={f.ph} value={form[f.name]} onChange={set} autoComplete={f.name}/>
      ))}
      <select className="finput" name="service" value={form.service} onChange={set} style={{ color: form.service ? "#0B1D3A" : "#a0afc0" }}>
        <option value="">Select a Service</option>
        {SERVICES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
      </select>
      <textarea className="finput" name="message" placeholder="Tell us about your care needs…" rows={4} value={form.message} onChange={set} style={{ resize: "vertical", marginBottom: 20 }}/>
      {error && <div style={{ color: "#dc3545", marginBottom: 12, fontSize: "0.9rem" }}>{error}</div>}
      <button className="btn btn-green" onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "15px" }}>
        {loading ? "Sending..." : "Send Message →"}
      </button>
    </div>
  );
}

function ApplicationForm() {
  const emptyForm = {
    name: "",
    email: "",
    phone: "",
    postcode: "",
    role: "",
    availability: "",
    experience: "",
    rightToWork: false,
    dbs: false,
    driving: false,
    message: "",
    cvFile: null,
  };
  const [form, setForm] = useState(emptyForm);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const cvFileRef = useRef(null);

  const set = e => {
    const { name, type, checked, value } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCVChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.includes(file.type) || fileName.endsWith(".doc") || fileName.endsWith(".docx") || fileName.endsWith(".pdf");

    if (!isValidType) {
      setError("CV must be a PDF, DOC, or DOCX file.");
      e.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      setError("CV file must be smaller than 5MB.");
      e.target.value = "";
      return;
    }

    setError("");
    setForm(f => ({ ...f, cvFile: file }));
  };

  const applicationMessage = [
    "Careers application",
    `Role: ${form.role || "Not selected"}`,
    `Availability: ${form.availability || "Not provided"}`,
    `Experience: ${form.experience || "Not provided"}`,
    `Right to work in the UK: ${form.rightToWork ? "Yes" : "Not confirmed"}`,
    `DBS status: ${form.dbs ? "Has DBS / willing to complete DBS" : "Not confirmed"}`,
    `Driving licence / car access: ${form.driving ? "Yes" : "No / not provided"}`,
    "",
    "Applicant note:",
    form.message || "No extra note provided.",
  ].join("\n");

  const buildMailtoHref = () => {
    const subject = encodeURIComponent(`Care job application from ${form.name || "Website applicant"}`);
    const body = encodeURIComponent([
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone || "Not provided"}`,
      `Postcode: ${form.postcode || "Not provided"}`,
      "",
      applicationMessage,
    ].join("\n"));
    return `mailto:info@3cscareservices.co.uk?subject=${subject}&body=${body}`;
  };

  const fallbackToEmailClient = () => {
    if (typeof window === "undefined") return false;
    window.location.href = buildMailtoHref();
    return true;
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone || !form.role || !form.rightToWork) {
      setError("Please complete the required fields and confirm your right to work in the UK.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("postcode", form.postcode);
      formData.append("service", "Care Worker Application");
      formData.append("message", applicationMessage);
      if (form.cvFile) {
        formData.append("cv", form.cvFile);
      }

      const response = await fetch("/api/send-message", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { error: await response.text() };

      if (!response.ok) {
        throw new Error(data.details ? `${data.error || "Failed to send application"}: ${data.details}` : (data.error || "Failed to send application"));
      }

      setSent(true);
    } catch (err) {
      const message = String(err?.message || "");
      const canFallback = message.includes("ECONNREFUSED") || message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("proxy error");
      if (canFallback && fallbackToEmailClient()) {
        setSent(true);
        return;
      }
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div style={{ textAlign: "center", padding: "36px 0" }}>
      <div style={{ width: 62, height: 62, borderRadius: "50%", background: "rgba(40,167,69,0.1)", border: "2px solid #28A745", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: "1.7rem" }}>✅</div>
      <h3 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 800, color: "#0B1D3A", marginBottom: 10 }}>Application Sent</h3>
      <p style={{ color: "#5a6a7e", marginBottom: 22, lineHeight: 1.7 }}>Thank you. Our recruitment team will review your details and contact you with the next step.</p>
      <button className="btn btn-ghost-green" onClick={() => { setSent(false); setForm(emptyForm); cvFileRef.current && (cvFileRef.current.value = ""); }} style={{ width: "auto", padding: "12px 28px" }}>Send Another</button>
    </div>
  );

  return (
    <div>
      <div className="form-grid-2">
        <input className="finput" name="name" type="text" placeholder="Full Name *" value={form.name} onChange={set} autoComplete="name"/>
        <input className="finput" name="email" type="email" placeholder="Email Address *" value={form.email} onChange={set} autoComplete="email"/>
        <input className="finput" name="phone" type="tel" placeholder="Phone Number *" value={form.phone} onChange={set} autoComplete="tel"/>
        <input className="finput" name="postcode" type="text" placeholder="Postcode" value={form.postcode} onChange={set} autoComplete="postal-code"/>
      </div>
      <select className="finput" name="role" value={form.role} onChange={set} style={{ color: form.role ? "#0B1D3A" : "#a0afc0" }}>
        <option value="">Role Applying For *</option>
        {CAREER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
      </select>
      <input className="finput" name="availability" type="text" placeholder="Availability, e.g. weekdays, nights, weekends" value={form.availability} onChange={set}/>
      <input className="finput" name="experience" type="text" placeholder="Care experience / qualifications" value={form.experience} onChange={set}/>
      <label className="check-row"><input type="checkbox" name="rightToWork" checked={form.rightToWork} onChange={set}/> I confirm I have the right to work in the UK *</label>
      <label className="check-row"><input type="checkbox" name="dbs" checked={form.dbs} onChange={set}/> I have a DBS check or I am willing to complete one</label>
      <label className="check-row"><input type="checkbox" name="driving" checked={form.driving} onChange={set}/> I have a driving licence / access to a car</label>
      <textarea className="finput" name="message" placeholder="Tell us why you would like to join 3Cs..." rows={4} value={form.message} onChange={set} style={{ resize: "vertical", marginBottom: 18 }}/>
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", marginBottom: 6, color: "#0B1D3A", fontWeight: 600, fontSize: "0.92rem" }}>Upload CV (PDF, DOC, DOCX - Max 5MB)</label>
        <input
          ref={cvFileRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleCVChange}
          style={{
            display: "block",
            width: "100%",
            padding: "10px 14px",
            border: "1px solid #d4dce6",
            borderRadius: "8px",
            fontSize: "0.92rem",
            color: "#0B1D3A",
            backgroundColor: "#fff",
            fontFamily: "inherit",
          }}
        />
        {form.cvFile && <div style={{ marginTop: 8, fontSize: "0.85rem", color: "#28A745" }}>✓ {form.cvFile.name}</div>}
      </div>
      {error && <div style={{ color: "#dc3545", marginBottom: 12, fontSize: "0.9rem" }}>{error}</div>}
      <button className="btn btn-green" onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "15px" }}>
        {loading ? "Sending..." : "Apply Now →"}
      </button>
    </div>
  );
}

/* ─── TESTIMONIAL CAROUSEL (mobile) / grid (tablet+) ─── */
function Testimonials() {
  return (
    <div>
      <div className="testi-grid">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i + 1}>
            <div className={`testi-card note-${i + 1}`}>
              <span className={i === 0 ? "testi-pin" : "testi-tape"} aria-hidden="true" />
              <div className="testi-quote">"</div>
              <div className="testi-stars">{"★".repeat(t.stars)}</div>
              <p className="testi-text">"{t.text}"</p>
              <div>
                <div className="testi-name">{t.name}</div>
                <div className="testi-role">{t.role}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ─── APP ─── */
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBtt, setShowBtt] = useState(false);
  const [activeNav, setActiveNav] = useState("Home");
  const [careSlide, setCareSlide] = useState(1);
  const [postcode, setPostcode] = useState("");
  const [postcodeMsg, setPostcodeMsg] = useState("");
  const [postcodeError, setPostcodeError] = useState(false);
  const [statsRef, statsVisible] = useReveal();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 50);
      setShowBtt(y > 400);
      // Active nav detection
      const sections = ["home","about-us","our-services","why-choose-us","testimonials","contact"];
      const labels = ["Home","About Us","Our Services","Why Choose Us","Testimonials","Contact"];
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && y >= el.offsetTop - 120) { setActiveNav(labels[i]); break; }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }, []);

  const checkCareArea = useCallback(() => {
    const cleaned = postcode.trim().toUpperCase();
    const ukPostcode = /^([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})$/i;
    if (!cleaned) {
      setPostcodeError(true);
      setPostcodeMsg("Enter your postcode and we will confirm care availability.");
      return;
    }
    if (!ukPostcode.test(cleaned)) {
      setPostcodeError(true);
      setPostcodeMsg("Please enter a valid UK postcode.");
      return;
    }
    setPostcode(cleaned);
    setPostcodeError(false);
    setPostcodeMsg("Thanks. Your postcode looks valid. Send the form and we will confirm care availability in your area.");
    go("contact-form");
  }, [go, postcode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCareSlide((prev) => (prev + 1) % CARE_ACTION_FEATURES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{CSS}</style>

      {/* ── Top bar ── */}
      <div className="topbar">
        <span>📞 <a href="tel:01162966163">0116 296 6163</a> &nbsp;·&nbsp; ✉ <a href="mailto:info@3cscareservices.co.uk">info@3cscareservices.co.uk</a></span>
        <span>📍 65A London Road, Oadby, Leicester LE2 5DN</span>
      </div>

      {/* ── Nav ── */}
      <nav className={`nav-wrap${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <div style={{ cursor: "pointer" }} onClick={() => go("home")}><BrandName/></div>
          <button className="mobile-primary-cta" onClick={() => go("contact-form")}>
            Enquire<br/>Now
          </button>
          <div className="nav-desktop">
            {NAV.map(l => (
              <a key={l} href="#" className={activeNav === l ? "active" : ""}
                onClick={e => { e.preventDefault(); go(l.toLowerCase().replace(/\s+/g, "-")); }}>
                {l}
              </a>
            ))}
            <button className="btn btn-green" style={{ padding: "9px 18px", fontSize: "0.82rem", width: "auto" }} onClick={() => go("contact-form")}>
              Book Free Assessment
            </button>
          </div>
          <button className="ham" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" aria-expanded={menuOpen}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
        <div className="mobile-care-search">
          <div className="care-search-field">
            <span className="care-search-icon" aria-hidden="true">⌖</span>
            <input
              className="care-search-input"
              type="text"
              placeholder="Enter your postcode..."
              aria-label="Postcode"
              value={postcode}
              onChange={e => {
                setPostcode(e.target.value);
                setPostcodeMsg("");
                setPostcodeError(false);
              }}
              onKeyDown={e => { if (e.key === "Enter") checkCareArea(); }}
              autoComplete="postal-code"
            />
          </div>
          <button className="care-search-btn" onClick={checkCareArea}>Check care</button>
        </div>
        {postcodeMsg && <div className={`care-search-msg${postcodeError ? " error" : ""}`}>{postcodeMsg}</div>}
        {menuOpen && (
          <div className="mob-menu">
            {NAV.map(l => (
              <a key={l} href="#" onClick={e => { e.preventDefault(); go(l.toLowerCase().replace(/\s+/g, "-")); }}>{l}</a>
            ))}
            <button className="btn btn-green" style={{ width: "100%", marginTop: 18, padding: "14px" }} onClick={() => go("contact-form")}>
              Book a Free Assessment
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section id="home" className="hero">
        <div className="sec-wide hero-layout">
          <div className="hero-text">
            <div className="hero-badge">COMPASSION · CARE · COMMITMENT</div>
            <h1 className="hero-h1">
              Compassionate Care<br/>
              <span style={{ color: "#28A745" }}>in the Comfort</span><br/>
              of Your Home
            </h1>
            <p className="hero-p">We deliver person-centred care that promotes independence, dignity, and quality of life — so your loved ones can thrive where they feel most at ease.</p>
            <div className="hero-btns">
              <button className="btn btn-green" onClick={() => go("our-services")} style={{ width: "auto", padding: "14px 32px" }}>Our Services</button>
              <button className="btn btn-ghost-white" onClick={() => go("contact-form")} style={{ width: "auto", padding: "14px 32px" }}>Book Free Assessment</button>
            </div>
            <div className="hero-trust">
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, #${["0B1D3A","1a3a5c","28A745"][i-1]}, #28A745)`, border: "2px solid #0B1D3A", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: i > 1 ? -10 : 0, fontSize: "0.7rem", color: "#fff", fontWeight: 700 }}>
                      {["PA","MJ","SO"][i-1]}
                    </div>
                  ))}
                </div>
              </div>
              <div className="hero-trust-text">
                <strong>500+ Families Trust Us</strong>
                CQC Registered · Fully Insured · DBS Checked Staff
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-img-wrap">
              <img src={IMAGES.hero} alt="Compassionate carer with elderly client at home" loading="eager"/>
              <div className="hero-img-overlay"/>
              <div className="hero-cert-badge">
                ✅ CQC Registered
              </div>
            </div>
          </div>
        </div>
        <svg viewBox="0 0 1440 52" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: "100%", height: 52, display: "block", marginTop: 36 }}>
          <path d="M0,26 C480,52 960,0 1440,26 L1440,52 L0,52 Z" fill="#ffffff"/>
        </svg>
      </section>

      {/* ── STATS (animated counters) ── */}
      <section className="stats-bg">
        <div className="sec-wide">
          <div className="stats-grid" ref={statsRef}>
            {STATS.map((s, i) => (
              <Counter key={s.label} target={s.target} suffix={s.suffix} label={s.label} visible={statsVisible}/>
            ))}
          </div>
        </div>
      </section>
      <div style={{ height: 4, background: "linear-gradient(90deg, #0B1D3A 0%, #28A745 50%, #0B1D3A 100%)" }}/>

      {/* ── SERVICES ── */}
      <section id="our-services" className="sec" style={{ background: "#F5F7FA" }}>
        <div className="sec-wide">
          <Reveal>
            <div className="text-center" style={{ marginBottom: 44 }}>
              <span className="label">WHAT WE OFFER</span>
              <h2 className="sec-h2">Our Services</h2>
              <p style={{ color: "#5a6a7e", marginTop: 12, maxWidth: 520, marginInline: "auto", lineHeight: 1.7 }}>
                Practical care, tailored support, and a calmer day-to-day life for you and your family.
              </p>
            </div>
          </Reveal>
          <div className="srv-grid">
            {SERVICES.map((s, i) => (
              <Reveal key={s.name} delay={(i % 4) + 1}>
                <div className="srv-card">
                  <div className="srv-icon">{s.icon}</div>
                  <div className="srv-name">{s.name}</div>
                  <p className="srv-desc">{s.desc}</p>
                  <span className="srv-more">Learn more →</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="service-proof" aria-label="Care quality highlights">
              <span>CQC registered</span>
              <span>DBS checked carers</span>
              <span>24-hour response aim</span>
            </div>
          </Reveal>
          <Reveal>
            <div className="text-center" style={{ marginTop: 40 }}>
            <button className="btn btn-green" onClick={() => go("contact-form")} style={{ width: "auto", padding: "14px 36px" }}>
              Book a Free Assessment
            </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CARE IN ACTION ── */}
      <section className="sec" style={{ background: "#fff" }}>
        <div className="sec-wide">
          <Reveal>
            <div className="text-center" style={{ marginBottom: 36 }}>
              <span className="label">CARE IN ACTION</span>
              <h2 className="sec-h2">Support That Feels Familiar</h2>
              <p style={{ color: "#5a6a7e", marginTop: 12, maxWidth: 560, marginInline: "auto", lineHeight: 1.7 }}>
                Everyday care moments delivered with patience, dignity, and a personal touch.
              </p>
            </div>
          </Reveal>
          <div className="care-layout">
            <Reveal>
              <div className="care-story">
                <span className="label">WHY THIS MATTERS</span>
                <h3>Care should feel lived-in, not staged.</h3>
                <p>
                  The right support doesn’t try to impress from a distance. It blends into the rhythm
                  of the home, brings calm to ordinary tasks, and leaves people feeling respected.
                </p>
                <ul className="care-mobile-bullets" aria-label="Care highlights">
                  {CARE_ACTION_NOTES.map((note) => (
                    <li key={note.title}>{note.title}</li>
                  ))}
                </ul>
                <div className="care-notes">
                  {CARE_ACTION_NOTES.map((note) => (
                    <div className="care-note" key={note.title}>
                      <div className="care-note-dot" />
                      <div>
                        <h4>{note.title}</h4>
                        <p>{note.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <div className="care-gallery" style={{ "--care-slide": careSlide }}>
              {CARE_ACTION_FEATURES.map((item, i) => (
                <Reveal key={item.src} delay={(i % 4) + 1}>
                  <figure className={`care-photo${i === 0 ? " feature" : ""}${careSlide === i ? " active" : ""}`} style={{ "--focus": item.focus }}>
                    <img src={item.src} alt={item.alt} loading={i < 2 ? "eager" : "lazy"} />
                    <figcaption className="care-caption">
                      <span className="care-kicker">Care moment {i + 1}</span>
                      <h4>{item.title}</h4>
                      <p>{item.body}</p>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
            <div className="care-dots" aria-label="Care story slides">
              {CARE_ACTION_FEATURES.map((item, i) => (
                <button
                  key={item.src}
                  type="button"
                  className={`care-dot${careSlide === i ? " active" : ""}`}
                  onClick={() => setCareSlide(i)}
                  aria-label={`Show care moment ${i + 1}`}
                  aria-pressed={careSlide === i}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section id="why-choose-us" className="sec" style={{ background: "#0B1D3A", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -80, top: -80, width: 360, height: 360, borderRadius: "50%", background: "rgba(40,167,69,0.06)", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", left: -60, bottom: -60, width: 280, height: 280, borderRadius: "50%", background: "rgba(40,167,69,0.04)", pointerEvents: "none" }}/>
        <div className="sec-wide">
          <Reveal>
            <div className="text-center" style={{ marginBottom: 44 }}>
              <span className="label">WHY 3Cs</span>
              <h2 className="sec-h2 sec-h2-white">
                Caring with Compassion,<br/>Confidence and Commitment
              </h2>
            </div>
          </Reveal>
          <div className="why-grid">
            {WHY.map((c, i) => (
              <Reveal key={c.title} delay={(i % 3) + 1}>
                <div className="why-card">
                  <div className="why-icon">{c.icon}</div>
                  <div className="why-title">{c.title}</div>
                  <p className="why-body">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about-us" className="sec" style={{ background: "#fff" }}>
        <div className="sec-wide about-inner">
          <Reveal>
            <div className="about-img-wrap">
              <img src={IMAGES.about} alt="Professional carer providing home care" loading="lazy"/>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,29,58,0.3) 0%, transparent 50%)" }}/>
              <div className="about-badge">
                <span>10+</span>Years of Trusted Care
              </div>
            </div>
          </Reveal>
          <Reveal delay={2}>
            <div>
              <span className="label">ABOUT US</span>
              <h2 className="sec-h2" style={{ marginTop: 8, marginBottom: 18 }}>
                High Quality Care<br/>in the Comfort of Your Home
              </h2>
              <p style={{ color: "#5a6a7e", lineHeight: 1.78, marginBottom: 14 }}>
                3Cs Care Services Limited was founded on a simple belief: everyone deserves to live well, with dignity, in the place they call home. Based in Oadby, Leicester, we serve individuals and families across the region with a full range of domiciliary care services.
              </p>
              <p style={{ color: "#5a6a7e", lineHeight: 1.78, marginBottom: 28 }}>
                Our carefully selected, fully trained carers work alongside clients and their families to craft care plans that genuinely fit — not just what's easiest, but what's right for each person.
              </p>
              {[
                "Compassion at the heart of everything we do",
                "Commitment to the highest care standards",
                "Consistency your family can truly rely on",
              ].map(v => (
                <div key={v} className="check-row">
                  <div className="check-dot">✓</div>
                  <span className="check-text">{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 32, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <button className="btn btn-navy" onClick={() => go("contact-form")} style={{ width: "auto", padding: "13px 28px" }}>Learn More</button>
                <a href="tel:01162966163" style={{ textDecoration: "none" }}>
                  <button className="btn btn-ghost-green" style={{ width: "auto", padding: "13px 28px" }}>📞 Call Us Now</button>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="sec" style={{ background: "#F5F7FA" }}>
        <div className="sec-wide">
          <Reveal>
            <div className="text-center" style={{ marginBottom: 44 }}>
              <span className="label">WHAT FAMILIES SAY</span>
              <h2 className="sec-h2">Trusted by Hundreds of Families</h2>
              <p style={{ color: "#5a6a7e", marginTop: 12, maxWidth: 480, marginInline: "auto", lineHeight: 1.7 }}>
                Don't just take our word for it — hear from the families we're proud to support every day.
              </p>
            </div>
          </Reveal>
          <Testimonials/>
          <Reveal>
            <div className="text-center" style={{ marginTop: 40 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #e4ecf6", borderRadius: 100, padding: "10px 20px" }}>
                <span style={{ color: "#f5a623", fontSize: "1.1rem" }}>★★★★★</span>
                <span style={{ color: "#0B1D3A", fontWeight: 700, fontSize: "0.88rem" }}>5.0 from 120+ reviews</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="sec faq-section">
        <div className="sec-wide">
          <Reveal>
            <div className="text-center" style={{ marginBottom: 36 }}>
              <span className="label">FREQUENTLY ASKED QUESTIONS</span>
              <h2 className="sec-h2">Answers to Common Questions</h2>
              <p style={{ color: "#5a6a7e", marginTop: 12, maxWidth: 560, marginInline: "auto", lineHeight: 1.7 }}>
                A quick guide to help you understand how we work, what we offer, and how to get started.
              </p>
            </div>
          </Reveal>
          <div className="faq-grid">
            {FAQS.map((item, i) => (
              <Reveal key={item.question} delay={(i % 4) + 1}>
                <details className="faq-item" open={i === 0}>
                  <summary className="faq-q">
                    <span>{item.question}</span>
                    <span className="faq-q-icon" aria-hidden="true">+</span>
                  </summary>
                  <div className="faq-a">
                    <p>{item.answer}</p>
                    {item.points && (
                      <ul className="faq-list">
                        {item.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL POSTS ── */}
      <section className="sec" style={{ background: "#fff" }}>
        <div className="sec-wide">
          <Reveal>
            <div className="text-center" style={{ marginBottom: 36 }}>
              <span className="label">FOLLOW US</span>
              <h2 className="sec-h2">From Our Community</h2>
            </div>
          </Reveal>
          <div className="posts-grid">
            {POSTS.map((p, i) => (
              <Reveal key={i} delay={(i % 4) + 1}>
                <div className="post-card" style={{ background: p.bg }}>
                  <div className="post-quote">"</div>
                  <p className="post-text">{p.text}</p>
                  <div className="post-footer">
                    <Logo size={26}/><span className="post-tag">{p.tag}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="sec" style={{ background: "#F5F7FA" }}>
        <div className="sec-wide">
          <Reveal>
            <div className="text-center" style={{ marginBottom: 44 }}>
              <span className="label">OUR PEOPLE</span>
              <h2 className="sec-h2">Meet the Team</h2>
              <p style={{ color: "#5a6a7e", marginTop: 12, maxWidth: 460, marginInline: "auto", lineHeight: 1.7 }}>
                Dedicated professionals who bring genuine care and warmth to every interaction.
              </p>
            </div>
          </Reveal>
          <div className="team-grid">
            {TEAM.map((t, i) => (
              <Reveal key={t.name} delay={i + 1}>
                <div className="team-card">
                  <div className="avatar">{t.initials}</div>
                  <div className="t-name">{t.name}</div>
                  <div className="t-role">{t.role}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="text-center" style={{ marginTop: 40 }}>
              <button className="btn btn-green" onClick={() => go("careers-apply")} style={{ width: "auto", padding: "14px 36px" }}>
                Join Our Team
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="careers-apply" className="sec" style={{ background: "#FFFFFF" }}>
        <div className="sec-wide careers-panel">
          <Reveal>
            <div>
              <span className="label">CAREERS</span>
              <h2 className="sec-h2">Apply to Join 3Cs Care Services</h2>
              <p style={{ color: "#5a6a7e", marginTop: 14, lineHeight: 1.78 }}>
                We are looking for kind, reliable carers who can support people with dignity at home. Tell us about your experience, availability, and right-to-work status.
              </p>
              <div className="career-list">
                {CAREER_ROLES.slice(0, 4).map(role => <div key={role}>{role}</div>)}
              </div>
              <p className="career-note" style={{ marginTop: 18 }}>
                CV upload can be handled during the follow-up call or by email. This form gets the important screening details to the team quickly.
              </p>
            </div>
          </Reveal>
          <Reveal delay={2}>
            <div className="form-box">
              <h3 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "#0B1D3A", marginBottom: 18 }}>
                Care Worker Application
              </h3>
              <ApplicationForm/>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <div className="cta-strip">
        <img src={IMAGES.cta} alt="" aria-hidden="true" loading="lazy"/>
        <div className="cta-inner">
          <Reveal>
            <span className="label">GET STARTED TODAY</span>
            <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem,5vw,2.8rem)", color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.15 }}>
              Ready to Talk About Care?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "1rem", lineHeight: 1.75, marginTop: 14, maxWidth: 520, marginInline: "auto" }}>
              Book a free, no-obligation home assessment today. Our team will visit at a time that suits you and your family.
            </p>
            <div className="cta-btns">
              <button className="btn btn-green" onClick={() => go("contact-form")} style={{ width: "auto", padding: "15px 36px", fontSize: "1rem" }}>
                Book Free Assessment
              </button>
              <a href="tel:01162966163" style={{ textDecoration: "none" }}>
                <button className="btn btn-ghost-white" style={{ width: "auto", padding: "15px 36px", fontSize: "1rem" }}>
                  📞 0116 296 6163
                </button>
              </a>
            </div>
          </Reveal>
        </div>
      </div>

      <a
        className="whatsapp-fab"
        href="https://wa.me/2348032897744"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <span className="whatsapp-fab-icon" aria-hidden="true">
          <svg viewBox="0 0 32 32" role="img" focusable="false">
            <path fill="#FFFFFF" d="M16.03 4.5c-6.24 0-11.32 5.02-11.32 11.2 0 2.12.6 4.16 1.74 5.94L4.5 27.5l6.08-1.9a11.45 11.45 0 0 0 5.45 1.39c6.24 0 11.32-5.02 11.32-11.2S22.27 4.5 16.03 4.5Zm0 20.55c-1.72 0-3.4-.47-4.87-1.36l-.35-.21-3.58 1.12 1.15-3.45-.23-.36a9.2 9.2 0 0 1-1.5-5.09c0-5.1 4.21-9.25 9.38-9.25s9.38 4.15 9.38 9.25-4.21 9.35-9.38 9.35Zm5.15-6.98c-.28-.14-1.66-.81-1.92-.9-.26-.09-.45-.14-.64.14-.19.28-.74.9-.9 1.08-.17.19-.33.21-.61.07-.28-.14-1.18-.43-2.25-1.37-.83-.73-1.39-1.64-1.55-1.92-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.64-1.53-.88-2.1-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.49.07-.75.35-.26.28-.99.96-.99 2.33s1.01 2.7 1.15 2.89c.14.19 1.98 3 4.8 4.2.67.29 1.2.46 1.61.59.68.21 1.29.18 1.78.11.54-.08 1.66-.67 1.9-1.32.23-.65.23-1.2.16-1.32-.07-.12-.26-.19-.54-.33Z"/>
          </svg>
        </span>
      </a>

      {/* ── CONTACT ── */}
      <section id="contact" className="sec" style={{ background: "#F5F7FA" }}>
        <div className="sec-wide">
          <Reveal>
            <div className="text-center" style={{ marginBottom: 44 }}>
              <span className="label">GET IN TOUCH</span>
              <h2 className="sec-h2">Contact Us</h2>
            </div>
          </Reveal>
          <div className="contact-grid">
            <Reveal>
              <div>
                {[
                  ["📞","PHONE","0116 296 6163","tel:01162966163"],
                  ["✉","EMAIL","info@3cscareservices.co.uk","mailto:info@3cscareservices.co.uk"],
                  ["🌐","WEBSITE","www.3cscareservices.co.uk","https://www.3cscareservices.co.uk"],
                  ["📍","ADDRESS","The Old School House, 65A London Road, Oadby, Leicester LE2 5DN", null],
                ].map(([icon, label, val, href]) => (
                  <div key={label} className="ci-item">
                    <div className="ci-icon">{icon}</div>
                    <div>
                      <div className="ci-label">{label}</div>
                      {href
                        ? <a href={href} className="ci-val" style={{ textDecoration: "none", color: "#0B1D3A" }}>{val}</a>
                        : <div className="ci-val">{val}</div>}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 28, padding: "18px 20px", background: "#0B1D3A", borderRadius: 12 }}>
                  <div style={{ color: "#4cde6e", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.08em", marginBottom: 8 }}>COMPASSION · CARE · COMMITMENT</div>
                  <p style={{ color: "#b3c6e0", fontSize: "0.86rem", lineHeight: 1.7 }}>Caring with Compassion, Confidence and Commitment. Registered with the Care Quality Commission.</p>
                  {/* Social links */}
                  <div className="social-links">
                    {[["f","Facebook"],["in","LinkedIn"],["tw","Twitter"],["yt","YouTube"]].map(([s, label]) => (
                      <a key={s} href="#" className="soc-icon" aria-label={label} title={label}>{s}</a>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={2}>
              <div id="contact-form" className="form-box">
                <h3 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "1.15rem", color: "#0B1D3A", marginBottom: 22 }}>
                  Send Us a Message
                </h3>
                <ContactForm initialPostcode={postcode}/>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#060f1e", padding: "56px 20px 28px" }}>
        <div className="sec-wide">
          <div className="foot-grid">
            <div>
              <div style={{ marginBottom: 18 }}><BrandName/></div>
              <p style={{ color: "#7a9bbf", fontSize: "0.875rem", lineHeight: 1.75, maxWidth: 290 }}>
                Caring with Compassion, Confidence and Commitment. Domiciliary care services that promote independence, dignity, and wellbeing.
              </p>
              <div style={{ marginTop: 20, padding: "12px 16px", background: "rgba(40,167,69,0.1)", borderLeft: "3px solid #28A745", borderRadius: "0 6px 6px 0" }}>
                <div style={{ color: "#4cde6e", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.08em" }}>COMPASSION · CARE · COMMITMENT</div>
              </div>
              <div className="social-links">
                {[["f","Facebook"],["in","LinkedIn"],["tw","Twitter"],["yt","YouTube"]].map(([s, label]) => (
                  <a key={s} href="#" className="soc-icon" aria-label={label}>{s}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ color: "#fff", fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "0.88rem", marginBottom: 18, letterSpacing: "0.05em" }}>Our Services</h4>
              {["Personal Care","Dementia Care","Live-in Care","Companionship","Medication Support","Respite Care","Domestic Support"].map(l => (
                <a key={l} className="foot-link" href="#" onClick={e => { e.preventDefault(); go("our-services"); }}>{l}</a>
              ))}
            </div>
            <div>
              <h4 style={{ color: "#fff", fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "0.88rem", marginBottom: 18, letterSpacing: "0.05em" }}>Company</h4>
              {[["About Us","about-us"],["Why Choose Us","why-choose-us"],["Testimonials","testimonials"],["Careers","careers-apply"],["Contact Us","contact"],["Privacy Policy","home"]].map(([l, id]) => (
                <a key={l} className="foot-link" href="#" onClick={e => { e.preventDefault(); go(id); }}>{l}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#7a9bbf", fontSize: "0.78rem" }}>© {new Date().getFullYear()} 3Cs Care Services Limited. All rights reserved.</span>
            <span style={{ color: "#7a9bbf", fontSize: "0.78rem" }}>65A London Road, Oadby, Leicester LE2 5DN</span>
          </div>
        </div>
      </footer>

      {/* ── BACK TO TOP ── */}
      <button className={`btt${!showBtt ? " hidden" : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">
        ↑
      </button>
    </>
  );
}
