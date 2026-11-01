export default function TermsOfServicePage({ onBack }) {
  return (
    <main style={{ minHeight: '100vh', padding: '48px 20px', background: '#f5f7fa' }}>
      <article style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(24px, 5vw, 52px)', border: '1px solid #e4ecf3', borderRadius: 22, background: '#fff', boxShadow: '0 18px 48px rgba(11,29,58,.08)', color: '#34445a', lineHeight: 1.75 }}>
        <button type="button" onClick={onBack} style={{ marginBottom: 20, padding: 0, border: 0, background: 'transparent', color: '#218838', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}>
          ← Back to 3CS Care Services
        </button>
        <p style={{ margin: 0, color: '#218838', fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase' }}>3CS Care Services Limited</p>
        <h1 style={{ margin: '8px 0', color: '#0B1D3A', fontSize: 'clamp(2rem, 5vw, 2.8rem)', lineHeight: 1.15 }}>Terms of Service</h1>
        <p style={{ marginTop: 0, color: '#68788d' }}>Last updated: 1 November 2026</p>

        <p>These terms apply when you use the 3CS Care Services website and provider portal. By using the website, you agree to these terms. Additional terms may apply when you agree to a specific referral or service arrangement.</p>

        <h2>Our service</h2>
        <p>3CS Care Services Limited (“3CS”, “we”, “us”) is an independent care-matching and referral service. We help people and their representatives identify independent care providers who may be suitable for an enquiry. 3CS does not provide, manage, or supervise regulated personal care. Any care is assessed, agreed, and delivered by the independent provider under a separate arrangement with the client.</p>
        <p>We do not provide medical advice, assess clinical suitability, or guarantee that a provider will be available, accept an enquiry, or enter into a care arrangement. Clients should discuss care requirements and any clinical questions directly with the prospective provider and relevant professionals.</p>

        <h2>Care enquiries and referrals</h2>
        <p>Information submitted through the website should be accurate and limited to what is relevant to the enquiry. By submitting an enquiry, you ask us to review it and, where appropriate, share relevant details with selected providers so they can decide whether to respond. Submitting an enquiry does not itself create a care contract with 3CS or a provider.</p>
        <p>We may contact you or a provider using the details supplied to clarify an enquiry or facilitate a potential introduction. You are responsible for deciding whether a provider and proposed care arrangement meet your needs.</p>

        <h2>Provider accounts and applications</h2>
        <p>Providers must provide accurate, current information, keep account credentials secure, and promptly update material changes to their business, services, service areas, availability, registration, insurance, and compliance information. Providers must use the portal only for lawful purposes and protect any client information they receive.</p>
        <p>Provider applications and supporting information may be reviewed by 3CS. Information remains self-declared unless expressly marked as reviewed. A 3CS platform review is not regulatory approval, does not replace checks by the relevant regulator, and does not by itself establish that a provider is suitable for a particular client.</p>
        <p>We may restrict or suspend an account or referral access where information appears inaccurate, required checks are incomplete, an account poses a security or compliance concern, or continued access could harm users or the service. Where reasonably possible, we will explain the reason and any steps needed to restore access.</p>

        <h2>Provider fees</h2>
        <p>There is no registration or joining fee. The current proposed introduction-fee structure is:</p>
        <ul>
          <li>£250 one-off introduction fee for a care package below 10 hours per week.</li>
          <li>£500 one-off introduction fee for a care package of 10 hours per week or more.</li>
        </ul>
        <p>For larger live-in, 24-hour, or particularly complex packages, the applicable fee will be agreed with the provider in advance. A fee is due only if a 3CS referral results in a care package being agreed and started, and the applicable fee is confirmed with the provider before the referral. There are no ongoing weekly commissions or recurring referral charges under this fee structure. The provider remains responsible for agreeing care charges and service terms directly with the client.</p>

        <h2>Website use and availability</h2>
        <p>Do not misuse the website, attempt to gain unauthorised access, interfere with its operation, submit malicious material, or use another person’s account without permission. We may change, suspend, or discontinue website features. We aim to keep the service available but do not guarantee uninterrupted or error-free access.</p>

        <h2>Third-party services</h2>
        <p>The website may link to or use third-party services. Those services are governed by their own terms and privacy notices. We are not responsible for third-party services that we do not operate.</p>

        <h2>Intellectual property</h2>
        <p>Unless otherwise stated, website content and branding belong to or are used by 3CS. You may use the website for its intended purpose, but must not reproduce or commercially exploit its content without permission, except where applicable law permits.</p>

        <h2>Liability</h2>
        <p>Nothing in these terms excludes or limits liability where it would be unlawful to do so, including liability for death or personal injury caused by negligence, fraud, or your statutory rights. To the extent permitted by law, 3CS is not responsible for care services provided by independent providers, or for decisions made under separate arrangements between a client and a provider.</p>

        <h2>Changes and contact</h2>
        <p>We may update these terms by publishing a revised version on this page. The updated date above indicates when they were last revised. If a change materially affects provider arrangements, we will take reasonable steps to notify affected providers.</p>
        <p>Questions about these terms can be sent to <a href="mailto:info@3cscareservices.co.uk">info@3cscareservices.co.uk</a> or by phone on <a href="tel:+441162766600">+44 116 276 6600</a>.</p>
      </article>
    </main>
  );
}
