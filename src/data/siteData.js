import heroImage from '../assets/optimized/e.jpg';
import aboutImage from '../assets/optimized/a.png';
import ctaImage from '../assets/optimized/d.png';

export const SERVICES = [
  { icon: '🏠', name: 'Personal Care', desc: 'Find CQC-registered providers for bathing, dressing, and daily personal routines.' },
  { icon: '🧠', name: 'Dementia Care', desc: 'Connect with providers experienced in calm, familiar dementia support.' },
  { icon: '🛏️', name: 'Live-in Care', desc: 'Explore introductions to providers offering round-the-clock care at home.' },
  { icon: '🤝', name: 'Companionship', desc: 'Find suitable support for friendly visits, conversation, and confidence at home.' },
  { icon: '💊', name: 'Medication Support', desc: 'Connect with providers who can assess medication support needs safely.' },
  { icon: '🌙', name: 'Respite Care', desc: 'Find short-term care options that give family carers time to rest.' },
  { icon: '🏡', name: 'Domestic Support', desc: 'Explore help with meals, light cleaning, laundry, and everyday tasks.' },
  { icon: '🏥', name: 'Hospital Discharge', desc: 'Find suitable providers for a smoother return home after hospital.' },
];

export const PROVIDER_LIST = [
  { id: 1, name: 'Oakwell Care Ltd', type: 'Domiciliary Care', area: 'Leicester', rating: 4.9, response: '< 30 mins', capacity: '2 new enquiries' },
  { id: 2, name: 'Grace House Support', type: 'Dementia Care', area: 'Coventry', rating: 4.8, response: '< 1 hour', capacity: '4 new enquiries' },
  { id: 3, name: 'The Hearth Collective', type: 'Live-in Care', area: 'Nottingham', rating: 4.7, response: '< 2 hours', capacity: '3 new enquiries' },
  { id: 4, name: 'Sunrise Health & Care', type: 'Respite Care', area: 'Birmingham', rating: 4.9, response: '< 45 mins', capacity: '1 new enquiry' },
];

export const LEAD_DATA = [
  { id: 'L-1042', family: 'M. Ahmed', need: 'Dementia care', area: 'Leicester LE2', urgency: 'Urgent', budget: '£35/hr', status: 'New', provider: 'Oakwell Care Ltd', score: 92 },
  { id: 'L-1048', family: 'S. Patel', need: 'Respite care', area: 'Coventry CV1', urgency: 'This week', budget: '£28/hr', status: 'Qualified', provider: 'Grace House Support', score: 86 },
  { id: 'L-1052', family: 'K. Morgan', need: 'Live-in care', area: 'Nottingham NG1', urgency: 'Soon', budget: '£40/hr', status: 'Replied', provider: 'The Hearth Collective', score: 89 },
  { id: 'L-1059', family: 'T. Benson', need: 'Personal care', area: 'Birmingham B16', urgency: 'This month', budget: '£30/hr', status: 'Booked', provider: 'Sunrise Health & Care', score: 80 },
];

export const CAREER_ROLES = [
  'Care Assistant',
  'Senior Care Assistant',
  'Live-in Carer',
  'Support Worker',
  'Weekend / Evening Carer',
];

export const WHY = [
  { icon: '💙', title: 'Needs-Led Matching', body: 'We listen first, then help you find providers suited to your location and care requirements.' },
  { icon: '✅', title: 'CQC-Registered Providers', body: 'Introductions are focused on suitable providers registered with the Care Quality Commission.' },
  { icon: '🌟', title: 'Privacy First', body: 'We do not publish individual carer or provider profiles for visitors to browse online.' },
  { icon: '📋', title: 'Clear Next Steps', body: 'Your chosen provider completes the formal assessment, agrees the care plan, and delivers care directly.' },
  { icon: '🕐', title: 'Responsive Support', body: 'Our team is here to guide families through the search and introduction process.' },
  { icon: '❤️', title: 'Independent Guidance', body: 'We make the search for care simpler while keeping the final care arrangement with the provider.' },
];

export const TESTIMONIALS = [
  { name: 'Margaret T.', role: 'Daughter of client', stars: 5, text: '3Cs helped us understand our options and introduced us to a suitable provider for my mother. The process felt clear, kind, and much less stressful.' },
  { name: 'James O.', role: 'Son of client', stars: 5, text: 'The team listened carefully to what my father needed and pointed us toward a provider who could assess him properly. It saved us a lot of time.' },
  { name: 'Patricia W.', role: 'Client', stars: 5, text: 'I did not know where to start with finding care. 3Cs made the first step easier and helped me speak with the right people.' },
];

export const POSTS = [
  { bg: '#0B1D3A', text: 'Finding suitable care starts with a calm conversation about what your family needs.', tag: '#3CsCareConnect' },
  { bg: '#28A745', text: 'We help families connect with trusted CQC-registered care providers.', tag: 'Compassion · Care · Commitment' },
  { bg: '#0B1D3A', text: 'Dementia care, live-in care, respite care, and more: we help you find suitable provider options.', tag: '#FindCare' },
  { bg: '#28A745', text: 'No public carer catalogue. Just careful introductions handled by our team.', tag: 'Privacy · Trust · Care' },
];

export const STATS = [
  { icon: '👥', target: 500, suffix: '+', label: 'Families Guided' },
  { icon: '📅', target: 10, suffix: '+', label: 'Years Experience' },
  { icon: '🤝', target: 50, suffix: '+', label: 'Provider Links' },
  { icon: '💚', target: 98, suffix: '%', label: 'Positive Feedback' },
];

export const IMAGES = {
  hero: heroImage,
  about: aboutImage,
  cta: ctaImage,
};

export const NAV = ['Home', 'About Us', 'Our Services', 'Why Choose Us', 'Testimonials', 'Contact'];

export const AUTH_KEYS = {
  provider: 'providerSession',
  admin: 'adminSession',
};

export const FAQS = [
  {
    question: 'Are you a care provider?',
    answer: 'No. 3CS Care Services is an independent care-matching and referral service. We do not provide or manage regulated personal care.',
  },
  {
    question: 'Are the providers CQC registered?',
    answer: 'We aim to refer clients only to providers whose relevant service is registered with the Care Quality Commission.',
  },
  {
    question: 'Who decides how much care I need?',
    answer: 'The selected care provider carries out the formal care assessment with you.',
  },
  {
    question: 'Who sets the price of my care?',
    answer: 'The care provider. 3CS Care Services does not determine the provider’s care charges.',
  },
  {
    question: 'Do I have to use the provider you introduce?',
    answer: 'No. The final decision remains with the client or family.',
  },
  {
    question: 'Can you help me compare providers?',
    answer: 'Yes. Clients can tell us their needs and we can identify suitable providers from our network.',
  },
  {
    question: 'How quickly can care start?',
    answer: 'This depends on the provider’s availability and the completion of the formal assessment.',
  },
  {
    question: 'Can you help with live-in or 24-hour care?',
    answer: 'Yes. Where available, we can match clients with providers offering live-in, overnight and 24-hour support.',
  },
  {
    question: 'Is there a charge for using 3CS Care Services?',
    answer: 'There is currently no charge to individuals or families for our care-matching service. Where a client successfully starts care with a provider introduced through 3CS, the care provider may pay 3CS a referral fee.',
  },
];

export const CARE_ACTION_NOTES = [
  {
    title: 'Familiar routines, gentle pacing',
    body: 'The right provider helps keep the day steady and reassuring so care feels calm from the start.',
  },
  {
    title: 'Small moments that matter',
    body: 'A warm meal, a made bed, or a calm conversation can help people feel seen, safe, and respected.',
  },
  {
    title: 'Support shaped around home',
    body: 'Good care should fit the rhythm of the home. We help you find providers who understand that.',
  },
];

export const PROVIDER_BENEFITS = [
  'Qualified private-care enquiries from real families',
  'Local matching by care type, area and urgency',
  'Simple onboarding for CQC-registered providers',
  'Lead management and referral tracking',
];

export const CARE_OPTIONS = [
  'Home care',
  'Dementia care',
  'Respite care',
  'Live-in care',
  'Supported living',
  'Companionship',
];

export const JOURNEY_STEPS = [
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
];

export const FAQS_OLD = [
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
];

export const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  postcode: '',
  careNeed: 'Home care',
  budget: '£20 - £40 per hour',
  urgency: 'Within 2 weeks',
  message: '',
};
