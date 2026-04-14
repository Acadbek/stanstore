import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | StanStore',
  description:
    'Privacy Policy for StanStore visitors, creators, and customers.',
};

const LAST_UPDATED = 'April 14, 2026';
const SITE_URL = process.env.BASE_URL || 'https://stanstore.uz';
const CONTACT_EMAIL = 'support@stanstore.uz';

const sections = [
  {
    id: 'scope',
    title: '1. Scope of This Policy',
    body: [
      `This Privacy Policy explains how StanStore collects, uses, discloses, and stores information when you visit ${SITE_URL}, create an account, open a storefront, publish products, or make purchases.`,
      'This policy applies to data processed through our website, dashboard, product pages, checkout flows, and support channels.',
    ],
  },
  {
    id: 'collection',
    title: '2. Information We Collect',
    body: [
      'Account data: name, email address, password hash, profile settings, and account preferences.',
      'Creator data: storefront branding, product details, prices, descriptions, links, and uploaded files.',
      'Transaction and subscription data: billing status, order metadata, and plan details managed through Stripe.',
      'Technical data: IP address, browser type, device identifiers, referral source, pages viewed, and session events.',
      'Support data: messages, feedback, and troubleshooting details you share with us.',
    ],
  },
  {
    id: 'cookies',
    title: '3. Cookies and Analytics',
    body: [
      'We use cookies and similar technologies to keep you signed in, remember preferences, secure sessions, and understand product usage.',
      'We may use analytics tools such as PostHog to measure performance and improve user experience. You can manage cookie settings in your browser.',
    ],
  },
  {
    id: 'usage',
    title: '4. How We Use Information',
    body: [
      'To provide core features, including authentication, storefront management, product publishing, and checkout flows.',
      'To protect the platform by detecting abuse, preventing fraud, and enforcing security controls.',
      'To process subscriptions, invoices, and payment-related tasks.',
      'To communicate product updates, service notices, and policy changes.',
      'To improve reliability, speed, and feature quality through diagnostics and analytics.',
    ],
  },
  {
    id: 'legal-basis',
    title: '5. Legal Basis for Processing',
    body: [
      'Where applicable, we process personal data based on one or more legal grounds: contract performance, legitimate interests, legal obligations, and your consent.',
      'You may withdraw consent where consent is the legal basis, subject to certain technical or legal limitations.',
    ],
  },
  {
    id: 'sharing',
    title: '6. How We Share Information',
    body: [
      'We share information only when necessary to operate StanStore, such as with payment processors, hosting providers, storage services, and analytics providers.',
      'We may disclose information when required by law, court order, or to protect rights, safety, and platform integrity.',
      'We do not sell your personal information as a standalone data product.',
    ],
  },
  {
    id: 'transfers',
    title: '7. International Data Transfers',
    body: [
      'Your information may be processed in countries other than your own, depending on our service providers and infrastructure.',
      'When required, we use appropriate safeguards for cross-border transfers.',
    ],
  },
  {
    id: 'retention',
    title: '8. Data Retention',
    body: [
      'We retain account and business records for as long as needed to provide services, maintain compliance, resolve disputes, and enforce agreements.',
      'Retention periods vary based on data type, legal obligations, fraud prevention needs, and legitimate operational requirements.',
    ],
  },
  {
    id: 'security',
    title: '9. Data Security',
    body: [
      'We use commercially reasonable safeguards, including access controls, encrypted transport, and logging to help protect personal data.',
      'No method of transmission or storage is fully secure, so we cannot guarantee absolute security.',
    ],
  },
  {
    id: 'rights',
    title: '10. Your Rights and Choices',
    body: [
      'You can review and edit parts of your account data from your dashboard.',
      'You may request account deletion and data access, correction, or deletion, subject to applicable law.',
      `To submit a privacy request, contact us at ${CONTACT_EMAIL}.`,
    ],
  },
  {
    id: 'children',
    title: "11. Children's Privacy",
    body: [
      'StanStore is not intended for children under 13, and we do not knowingly collect personal information from children.',
      'If you believe a child has provided personal data, contact us so we can review and remove it when appropriate.',
    ],
  },
  {
    id: 'updates',
    title: '12. Policy Updates',
    body: [
      'We may update this Privacy Policy to reflect product, legal, or operational changes.',
      'When we make material updates, we will post the revised version with a new "Last updated" date.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-orange-50 via-white to-slate-50"
      style={{ fontFamily: "'Geist Sans', sans-serif" }}
    >
      <div className="pointer-events-none absolute -left-24 top-8 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="rounded-3xl border border-orange-200/60 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <p
            className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700"
            style={{ fontFamily: "'Geist Mono', monospace" }}
          >
            LEGAL DOCUMENT
          </p>
          <h1
            className="mt-4 text-3xl leading-tight text-slate-900 sm:text-5xl"
            style={{ fontFamily: "'Hedvig Serif', serif" }}
          >
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
          <p className="mt-5 max-w-3xl text-slate-700">
            Your trust matters to us. This page explains what information we
            collect, why we collect it, and how you can control your data while
            using StanStore.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                What We Collect
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                Account, storefront, payment, and usage data.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Why We Use It
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                To run, secure, and improve the platform.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Your Control
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                Access, correction, deletion, and privacy requests.
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
                      className="block rounded-lg px-2 py-1.5 text-sm text-slate-700 transition hover:bg-orange-50 hover:text-orange-700"
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
                id={section.id}
                key={section.id}
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

            <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:p-6">
              <h2
                className="text-xl text-slate-900 sm:text-2xl"
                style={{ fontFamily: "'Hedvig Serif', serif" }}
              >
                Contact
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-slate-700">
                For privacy-related requests, contact{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold text-orange-700 underline"
                >
                  {CONTACT_EMAIL}
                </a>
                . You can also review our{' '}
                <Link
                  href="/terms-of-service"
                  className="font-semibold text-orange-700 underline"
                >
                  Terms of Service
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
