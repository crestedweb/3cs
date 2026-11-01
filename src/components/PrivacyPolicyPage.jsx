export default function PrivacyPolicyPage({ onBack }) {
  return (
    <main style={{ minHeight: '100vh', padding: '48px 20px', background: '#f5f7fa' }}>
      <article style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(24px, 5vw, 52px)', border: '1px solid #e4ecf3', borderRadius: 22, background: '#fff', boxShadow: '0 18px 48px rgba(11,29,58,.08)', color: '#34445a', lineHeight: 1.75 }}>
        <button type="button" onClick={onBack} style={{ marginBottom: 20, padding: 0, border: 0, background: 'transparent', color: '#218838', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}>
          ← Back to 3CS Care Services
        </button>
        <p style={{ margin: 0, color: '#218838', fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase' }}>3CS Care Services Limited</p>
        <h1 style={{ margin: '8px 0', color: '#0B1D3A', fontSize: 'clamp(2rem, 5vw, 2.8rem)', lineHeight: 1.15 }}>Privacy Policy</h1>
        <p style={{ marginTop: 0, color: '#68788d' }}>Last updated: 1 November 2026</p>

        <p>This policy explains how 3CS Care Services Limited (“3CS”, “we”, “us”) handles personal information when you visit our website, make a care enquiry, or apply to join our provider network. 3CS is an independent care referral and matching service; care is delivered by independent providers, not by 3CS.</p>

        <h2>Information we collect</h2>
        <p>Depending on how you use the website, we may collect:</p>
        <ul>
          <li><strong>Care enquiries:</strong> your name, contact details, postcode or area, care requested, preferred timing or budget, and the details you choose to include in your message.</li>
          <li><strong>Provider applications:</strong> contact and business details, email address, telephone number, business address and postcode, registration and regulator details, areas served, services and care needs supported, availability, insurance expiry dates, policy declarations, and information you submit during verification.</li>
          <li><strong>Account information:</strong> provider login credentials are managed through Supabase authentication. We do not receive or store a provider’s plain-text password when Supabase authentication is used.</li>
          <li><strong>Technical information:</strong> information sent by your browser or needed to operate the site, protect accounts, and maintain security.</li>
        </ul>
        <p>Please avoid including detailed medical records or other sensitive information in a general enquiry. If information about health or care needs is necessary to help arrange a referral, provide only what is relevant.</p>

        <h2>How we use information</h2>
        <p>We use information to respond to care enquiries, assess and route suitable referrals, contact families and providers, create and administer provider accounts, review provider applications, maintain website security, and meet legal obligations. Provider information may also be used to determine whether a provider is suitable for a particular enquiry.</p>

        <h2>Sharing information</h2>
        <p>To arrange a requested referral, we may share relevant enquiry details with selected independent care providers so they can assess whether they can meet the requested needs and contact you. We share only information relevant to that referral. Once a provider receives information, that provider is responsible for its own handling of it.</p>
        <p>We also use service providers to operate the website and its functions, including Supabase for authentication and data storage, Postcodes.io for UK postcode and place lookups, Google when a user chooses Google sign-in, and email or hosting services. These providers process information as needed to provide their services. We do not sell personal information.</p>

        <h2>Lawful bases and sensitive information</h2>
        <p>UK data protection law requires a lawful basis for processing personal information. Depending on the situation, this may include taking steps at your request, our legitimate interests in operating a referral service and managing provider applications, your consent where we ask for it, or complying with a legal obligation. Where information about health or another special category is necessary, an additional UK GDPR condition must also apply. We will not use sensitive information for unrelated purposes.</p>

        <h2>Cookies and browser storage</h2>
        <p>The website may use essential browser storage to keep provider or administrator login state and support secure authentication. You can control or clear storage through your browser settings; doing so may prevent account features from working. Supabase or Google may also use their own technologies during authentication. This site should not use non-essential analytics or advertising storage without any consent required by law.</p>

        <h2>How long we keep information</h2>
        <p>We keep information only for as long as it is needed for the purposes described above, including responding to enquiries, administering provider accounts, handling disputes, and meeting legal or record-keeping requirements. Retention periods depend on the type of record and its purpose; information is then securely deleted or anonymised where appropriate.</p>

        <h2>Security and international processing</h2>
        <p>We use access controls and other appropriate safeguards to protect information. No online service can guarantee absolute security. Our service providers may process information in the UK or other countries, depending on their service configuration. Where required, appropriate safeguards must be in place for international transfers.</p>

        <h2>Your rights</h2>
        <p>Subject to applicable law, you may have the right to request access to your personal information, correct it, ask for it to be erased or restricted, object to certain processing, or request a portable copy. If we rely on consent, you can withdraw it; this does not affect processing that took place before withdrawal. You may also complain to the UK Information Commissioner’s Office at <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer">ico.org.uk</a>.</p>

        <h2>Contact us</h2>
        <p>For privacy questions or requests, contact 3CS Care Services Limited at <a href="mailto:info@3cscareservices.co.uk">info@3cscareservices.co.uk</a> or call <a href="tel:+441162766600">+44 116 276 6600</a>.</p>
      </article>
    </main>
  );
}
