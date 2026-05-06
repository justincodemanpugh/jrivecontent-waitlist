import Link from "next/link";

export const metadata = {
  title: "Terms of Service — JriveContent",
};

const LAST_UPDATED = "May 6, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-mist/40 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href="/"
          className="text-xs font-medium text-slate-500 hover:text-brand-ink"
        >
          ← Back to home
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-6 space-y-6 text-sm leading-6 text-slate-700">
          <Section title="1. Acceptance of these Terms">
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) form a binding
              agreement between you and JriveContent (&ldquo;JriveContent,&rdquo;
              &ldquo;we,&rdquo; &ldquo;us&rdquo;). By creating an account or
              otherwise using the platform at jrivecontent.com (the
              &ldquo;Platform&rdquo;), you agree to be bound by these Terms and
              our{" "}
              <Link href="/privacy" className="font-medium text-brand-skyDeep hover:underline">
                Privacy Policy
              </Link>
              . If you do not agree, do not use the Platform.
            </p>
            <p>
              You must be at least 18 years old and able to form a binding
              contract. If you are using the Platform on behalf of a company,
              you represent that you have authority to bind that company.
            </p>
          </Section>

          <Section title="2. What JriveContent is">
            <p>
              JriveContent is a marketplace that connects brands
              (&ldquo;Brands&rdquo;) with content creators
              (&ldquo;Creators&rdquo;) for paid content collaborations
              (&ldquo;Gigs&rdquo;). JriveContent is not a party to any agreement
              between a Brand and a Creator and does not employ Creators.
              Creators perform services as independent contractors.
            </p>
          </Section>

          <Section title="3. Accounts">
            <ul className="ml-5 list-disc space-y-1">
              <li>
                You must provide accurate information and keep your account
                secure. You are responsible for activity under your account.
              </li>
              <li>
                One account per person or legal entity. You must not share or
                transfer your account.
              </li>
              <li>
                We may suspend or terminate accounts that violate these Terms,
                applicable law, or that pose risk to other users.
              </li>
            </ul>
          </Section>

          <Section title="4. Brand terms">
            <ul className="ml-5 list-disc space-y-1">
              <li>
                Gigs you post must be accurate, lawful, and free of
                discriminatory, deceptive, or unsafe requirements.
              </li>
              <li>
                You are responsible for paying agreed-upon Gig fees and
                applicable Platform fees on time. Funds may be held in escrow
                until deliverables are accepted.
              </li>
              <li>
                Unless otherwise agreed in writing, content licenses you receive
                from Creators are limited to the scope described in the Gig
                (territory, media, and duration). You may not reuse Creator
                content outside the agreed scope.
              </li>
              <li>
                You must comply with all applicable advertising laws, including
                FTC endorsement and disclosure rules.
              </li>
            </ul>
          </Section>

          <Section title="5. Creator terms">
            <ul className="ml-5 list-disc space-y-1">
              <li>
                You represent that you own or have the necessary rights to all
                content you submit, and that your content does not infringe any
                third party&rsquo;s rights.
              </li>
              <li>
                You agree to deliver work that meets the Gig brief and
                deadlines. Material misrepresentation of metrics, identity, or
                deliverables is prohibited.
              </li>
              <li>
                You are an independent contractor responsible for your own
                taxes. JriveContent does not provide employment benefits.
              </li>
              <li>
                You will comply with FTC endorsement and disclosure rules
                (e.g.&nbsp;#ad, sponsored disclosures) and any platform-specific
                disclosure requirements.
              </li>
            </ul>
          </Section>

          <Section title="6. Fees and payments">
            <p>
              JriveContent charges Platform fees as disclosed in-product before
              a transaction. Payments are processed by third-party providers
              (e.g.&nbsp;Stripe) subject to their terms. You authorize us and
              our processors to charge or pay out using the payment methods you
              connect.
            </p>
          </Section>

          <Section title="7. Off-platform circumvention">
            <p>
              Brands and Creators introduced through the Platform must transact
              for the resulting work on the Platform. Circumventing the Platform
              to avoid fees is a material breach and may result in suspension,
              termination, or recovery of unpaid fees.
            </p>
          </Section>

          <Section title="8. Acceptable use">
            <p>You agree not to:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Use the Platform for unlawful, deceptive, or harmful purposes;</li>
              <li>Harass, threaten, or impersonate any person;</li>
              <li>Upload malware or attempt to disrupt the Platform;</li>
              <li>Scrape or reverse engineer the Platform;</li>
              <li>Post sexually explicit, hateful, or violent content;</li>
              <li>Infringe intellectual property or privacy rights of others.</li>
            </ul>
          </Section>

          <Section title="9. Intellectual property">
            <p>
              Creators retain ownership of content they create. By submitting
              content, you grant JriveContent a worldwide, non-exclusive,
              royalty-free license to host, display, and promote that content
              on and in connection with the Platform. Licenses to Brands are
              governed by each individual Gig agreement.
            </p>
            <p>
              The JriveContent name, logo, and Platform are owned by
              JriveContent and protected by intellectual property laws.
            </p>
          </Section>

          <Section title="10. Disputes between users">
            <p>
              Brands and Creators are responsible for resolving disputes between
              themselves. JriveContent may, at its discretion, assist in
              mediating, releasing escrowed funds, or issuing refunds, but is
              not obligated to do so.
            </p>
          </Section>

          <Section title="11. Termination">
            <p>
              You may close your account at any time. We may suspend or
              terminate your access for violations of these Terms or for risk,
              legal, or security reasons. Sections that by their nature should
              survive termination (e.g.&nbsp;IP, disclaimers, liability,
              dispute resolution) will survive.
            </p>
          </Section>

          <Section title="12. Disclaimers">
            <p>
              The Platform is provided &ldquo;as is&rdquo; and &ldquo;as
              available,&rdquo; without warranties of any kind, whether express
              or implied, including merchantability, fitness for a particular
              purpose, and non-infringement. We do not guarantee uninterrupted
              service or specific outcomes from any Gig.
            </p>
          </Section>

          <Section title="13. Limitation of liability">
            <p>
              To the maximum extent permitted by law, JriveContent will not be
              liable for indirect, incidental, special, consequential, or
              punitive damages, or for lost profits or revenues. Our aggregate
              liability for any claim arising out of or relating to these Terms
              or the Platform will not exceed the greater of (a)&nbsp;the fees
              you paid to JriveContent in the twelve months preceding the
              claim, or (b)&nbsp;US$100.
            </p>
          </Section>

          <Section title="14. Indemnification">
            <p>
              You agree to indemnify and hold JriveContent harmless from any
              claims, damages, or expenses arising from your content, your use
              of the Platform, your violation of these Terms, or your violation
              of any rights of a third party.
            </p>
          </Section>

          <Section title="15. Governing law and disputes">
            <p>
              These Terms are governed by the laws of the State of Delaware,
              USA, without regard to conflict-of-laws principles. Any dispute
              not resolved informally will be brought in the state or federal
              courts located in Delaware, and you consent to that jurisdiction.
              Where permitted, you and JriveContent waive any right to a jury
              trial and to participate in a class action.
            </p>
          </Section>

          <Section title="16. Changes to these Terms">
            <p>
              We may update these Terms from time to time. If changes are
              material, we will notify you (e.g.&nbsp;by email or in-product
              notice) before they take effect. Continued use of the Platform
              after changes take effect constitutes acceptance.
            </p>
          </Section>

          <Section title="17. Contact">
            <p>
              Questions about these Terms can be sent to{" "}
              <a
                href="mailto:hello@jrivecontent.com"
                className="font-medium text-brand-skyDeep hover:underline"
              >
                hello@jrivecontent.com
              </a>
              .
            </p>
          </Section>

          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            This document is a starting point and is not legal advice. Please
            have it reviewed by qualified counsel before public launch.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-brand-ink">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
