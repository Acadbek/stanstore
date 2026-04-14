import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | StanStore',
  description: 'Terms of Service for creators and customers using StanStore.',
};

const LAST_UPDATED = 'April 14, 2026';
const CONTACT_EMAIL = 'support@stanstore.uz';

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    body: [
      'By accessing or using StanStore, you agree to these Terms of Service and our Privacy Policy.',
      'If you do not agree with these terms, you should not use the platform.',
    ],
  },
  {
    id: 'eligibility',
    title: '2. Eligibility and Account Registration',
    body: [
      'You must be legally capable of entering into a binding agreement to use StanStore.',
      'You agree to provide accurate registration details and keep account information updated.',
      'You are responsible for all activity performed under your account.',
    ],
  },
  {
    id: 'security',
    title: '3. Account Security',
    body: [
      'Keep your credentials confidential and use strong passwords.',
      'Notify us immediately if you suspect unauthorized account access.',
      'We may suspend accounts to protect users, platform integrity, or legal compliance.',
    ],
  },
  {
    id: 'creator-content',
    title: '4. Creator Content and Storefront Responsibility',
    body: [
      'Creators are solely responsible for storefront content, product claims, pricing, and fulfillment.',
      'You must own the rights to all uploaded or distributed material.',
      'Prohibited content includes illegal, infringing, fraudulent, harmful, or deceptive material.',
    ],
  },
  {
    id: 'license',
    title: '5. License to Operate Your Content',
    body: [
      'You keep ownership of your content. By using StanStore, you grant us a limited, non-exclusive license to host, process, and display your content to run the service.',
      'This license ends when your content is removed, except where retention is required for legal, security, or backup purposes.',
    ],
  },
  {
    id: 'payments',
    title: '6. Payments, Billing, and Subscriptions',
    body: [
      'Paid features and subscriptions are processed by Stripe and subject to Stripe terms.',
      'Plan pricing, billing cycle, and included features are shown during checkout.',
      'Unless required by law or stated otherwise, charges are non-refundable.',
    ],
  },
  {
    id: 'fees',
    title: '7. Taxes and Fees',
    body: [
      'You are responsible for taxes, duties, and reporting obligations related to your sales and earnings, except where StanStore is legally required to collect or remit.',
      'Processing and platform fees may apply and can be updated with advance notice where required.',
    ],
  },
  {
    id: 'prohibited',
    title: '8. Prohibited Conduct',
    body: [
      'You agree not to misuse the platform, reverse engineer protected systems, distribute malware, scrape restricted data, or interfere with service operations.',
      'Spam, impersonation, chargeback abuse, and attempts to bypass payment workflows are prohibited.',
    ],
  },
  {
    id: 'third-parties',
    title: '9. Third-Party Services',
    body: [
      'StanStore integrates with third-party providers such as Stripe, hosting platforms, and analytics tools.',
      'We are not responsible for third-party services, policies, or outages outside our control.',
    ],
  },
  {
    id: 'termination',
    title: '10. Suspension and Termination',
    body: [
      'You may stop using StanStore at any time.',
      'We may suspend or terminate access for policy violations, security risks, fraud, legal requests, or platform abuse.',
      'Certain provisions survive termination, including payment obligations, legal rights, and liability limitations.',
    ],
  },
  {
    id: 'warranty',
    title: '11. Warranty Disclaimer',
    body: [
      'StanStore is provided "as is" and "as available" without warranties of uninterrupted operation, merchantability, fitness for a particular purpose, or non-infringement.',
      'We do not guarantee that the service will be error-free or always available in all regions.',
    ],
  },
  {
    id: 'liability',
    title: '12. Limitation of Liability',
    body: [
      'To the maximum extent permitted by law, StanStore is not liable for indirect, incidental, special, consequential, or punitive damages.',
      'Our total liability for claims related to the service is limited to amounts paid by you to StanStore during the 12 months before the claim, where legally permitted.',
    ],
  },
  {
    id: 'indemnity',
    title: '13. Indemnification',
    body: [
      'You agree to indemnify and hold StanStore harmless from claims, liabilities, and expenses arising from your content, storefront activity, legal violations, or misuse of the platform.',
    ],
  },
  {
    id: 'changes',
    title: '14. Changes to Terms',
    body: [
      'We may update these Terms to reflect product, legal, or operational changes.',
      'Your continued use of StanStore after updates means you accept the revised terms.',
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-emerald-50"
      style={{ fontFamily: "'Geist Sans', sans-serif" }}
    >
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-sky-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-44 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="rounded-3xl border border-sky-200/70 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <p
            className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700"
            style={{ fontFamily: "'Geist Mono', monospace" }}
          >
            LEGAL DOCUMENT
          </p>
          <h1
            className="mt-4 text-3xl leading-tight text-slate-900 sm:text-5xl"
            style={{ fontFamily: "'Hedvig Serif', serif" }}
          >
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
          <p className="mt-5 max-w-3xl text-slate-700">
            These terms define the rules for using StanStore as a creator or
            customer. They help protect both users and the platform.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Accounts
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                Keep your account secure and information accurate.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Payments
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                Billing is handled through Stripe and checkout terms.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Platform Safety
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                Fraud, abuse, and illegal content are not allowed.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <nav className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p
                className="text-xs uppercase tracking-wide text-slate-500"
                style={{ fontFamily: "'Geist Mono', monospace" }}
              >
                On this page
              </p>
              <ul className="mt-3 space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block rounded-lg px-2 py-1.5 text-sm text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="space-y-4">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <h2
                  className="text-xl text-slate-900 sm:text-2xl"
                  style={{ fontFamily: "'Hedvig Serif', serif" }}
                >
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-700">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:p-6">
              <h2
                className="text-xl text-slate-900 sm:text-2xl"
                style={{ fontFamily: "'Hedvig Serif', serif" }}
              >
                Questions
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-slate-700">
                If you have questions about these terms, email{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold text-sky-700 underline"
                >
                  {CONTACT_EMAIL}
                </a>
                . You can also review our{' '}
                <Link
                  href="/privacy-policy"
                  className="font-semibold text-sky-700 underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}
