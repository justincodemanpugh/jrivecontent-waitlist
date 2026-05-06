import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — JriveContent",
};

const LAST_UPDATED = "May 6, 2026";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-6 space-y-6 text-sm leading-6 text-slate-700">
          <Section title="1. Who we are">
            <p>
              JriveContent (&ldquo;JriveContent,&rdquo; &ldquo;we,&rdquo;
              &ldquo;us&rdquo;) operates jrivecontent.com (the
              &ldquo;Platform&rdquo;). This Privacy Policy explains what
              information we collect, how we use it, who we share it with, and
              the rights you have.
            </p>
            <p>
              You can contact us about privacy at{" "}
              <a
                href="mailto:privacy@jrivecontent.com"
                className="font-medium text-brand-skyDeep hover:underline"
              >
                privacy@jrivecontent.com
              </a>
              .
            </p>
          </Section>

          <Section title="2. Information we collect">
            <p>
              <span className="font-medium text-brand-ink">Account &amp; auth.</span>{" "}
              Email address, password (stored as a hashed value by our auth
              provider), and, if you sign in with Google, the basic profile
              fields Google provides (name, email, avatar).
            </p>
            <p>
              <span className="font-medium text-brand-ink">Profile.</span> For
              brands: brand name, website, industry, stage, budget range,
              content needs, and referral source. For creators: display name,
              handle, bio, niches, content types, rate range, location,
              portfolio URL, and social handles (Instagram, TikTok, YouTube).
            </p>
            <p>
              <span className="font-medium text-brand-ink">Content.</span>{" "}
              Media, messages, gig submissions, and other content you upload or
              send through the Platform.
            </p>
            <p>
              <span className="font-medium text-brand-ink">Payments.</span> Card
              details are collected and stored by our payment processor (e.g.{" "}
              Stripe). We receive limited information such as the last four
              digits, brand of card, and transaction status &mdash; we do not
              store full card numbers.
            </p>
            <p>
              <span className="font-medium text-brand-ink">Usage &amp; device.</span>{" "}
              IP address, browser, device, pages visited, referring URLs, and
              timestamps, collected via standard server logs and analytics
              cookies.
            </p>
          </Section>

          <Section title="3. How we collect it">
            <ul className="ml-5 list-disc space-y-1">
              <li>Directly from you when you sign up, onboard, or use the Platform;</li>
              <li>
                Automatically through cookies, server logs, and analytics
                tools;
              </li>
              <li>
                From third parties such as Google (when you use Google sign-in)
                and our payment processor.
              </li>
            </ul>
          </Section>

          <Section title="4. How we use information">
            <ul className="ml-5 list-disc space-y-1">
              <li>To provide, operate, and improve the Platform;</li>
              <li>To match brands with creators and process gigs;</li>
              <li>To process payments and prevent fraud;</li>
              <li>
                To communicate with you about your account, transactions, and
                product updates;
              </li>
              <li>To enforce our Terms and comply with legal obligations;</li>
              <li>To send marketing communications, with your consent where required.</li>
            </ul>
          </Section>

          <Section title="5. Legal bases (for users in the EEA / UK)">
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <span className="font-medium text-brand-ink">Contract:</span>{" "}
                to provide the Platform you request.
              </li>
              <li>
                <span className="font-medium text-brand-ink">Legitimate interests:</span>{" "}
                to operate, secure, and improve the Platform.
              </li>
              <li>
                <span className="font-medium text-brand-ink">Consent:</span>{" "}
                for marketing where required and for non-essential cookies.
              </li>
              <li>
                <span className="font-medium text-brand-ink">Legal obligation:</span>{" "}
                to comply with tax, accounting, and other laws.
              </li>
            </ul>
          </Section>

          <Section title="6. Who we share information with">
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <span className="font-medium text-brand-ink">Service providers</span>{" "}
                that help us run the Platform, including hosting (Vercel),
                database &amp; auth (Supabase), payments (Stripe), email
                delivery, and analytics. They process information only on our
                instructions.
              </li>
              <li>
                <span className="font-medium text-brand-ink">Other users</span>{" "}
                where you choose to share information &mdash; e.g.&nbsp;a
                creator&rsquo;s public profile is visible to brands, and
                information you exchange to fulfill a gig is shared with the
                counterparty.
              </li>
              <li>
                <span className="font-medium text-brand-ink">Legal authorities</span>{" "}
                when required by law or to protect rights, property, or
                safety.
              </li>
              <li>
                <span className="font-medium text-brand-ink">Successors</span>{" "}
                in connection with a merger, acquisition, or sale of assets,
                subject to this Policy.
              </li>
            </ul>
            <p>We do not sell your personal information.</p>
          </Section>

          <Section title="7. Cookies">
            <p>
              We use essential cookies to keep you signed in and to operate
              core features, and we may use analytics cookies to understand
              usage. You can control cookies through your browser settings.
              Where required by law, we ask for consent before setting
              non-essential cookies.
            </p>
          </Section>

          <Section title="8. Data retention">
            <p>
              We retain account and profile data while your account is active
              and for a reasonable period afterward to comply with legal
              obligations, resolve disputes, and enforce our agreements.
              Transaction records may be retained longer where required by tax
              and financial regulations.
            </p>
          </Section>

          <Section title="9. Your rights">
            <p>
              Depending on where you live, you may have the right to access,
              correct, delete, or port your personal information; to object to
              or restrict certain processing; and to withdraw consent. EU/UK
              users may lodge a complaint with their local supervisory
              authority. California residents have rights under the CCPA/CPRA,
              including the right to know, delete, correct, and opt out of
              &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; (we do not sell or
              share personal information as those terms are commonly used).
            </p>
            <p>
              To exercise any of these rights, email{" "}
              <a
                href="mailto:privacy@jrivecontent.com"
                className="font-medium text-brand-skyDeep hover:underline"
              >
                privacy@jrivecontent.com
              </a>
              .
            </p>
          </Section>

          <Section title="10. Security">
            <p>
              We use reasonable technical and organizational measures to
              protect your information, including encryption in transit, hashed
              password storage by our auth provider, and access controls. No
              method of transmission or storage is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </Section>

          <Section title="11. International transfers">
            <p>
              We may process information in the United States and other
              countries. Where required, we use appropriate safeguards (such as
              Standard Contractual Clauses) for transfers from the EEA, UK, or
              Switzerland.
            </p>
          </Section>

          <Section title="12. Children">
            <p>
              The Platform is not directed to children under 18, and we do not
              knowingly collect information from anyone under 18. If you
              believe a child has provided us information, please contact us
              and we will take appropriate steps.
            </p>
          </Section>

          <Section title="13. Changes to this Policy">
            <p>
              We may update this Privacy Policy from time to time. We will post
              the updated version with a new &ldquo;Last updated&rdquo; date
              and, if changes are material, notify you in-product or by email.
            </p>
          </Section>

          <Section title="14. Contact">
            <p>
              Questions or requests can be sent to{" "}
              <a
                href="mailto:privacy@jrivecontent.com"
                className="font-medium text-brand-skyDeep hover:underline"
              >
                privacy@jrivecontent.com
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
