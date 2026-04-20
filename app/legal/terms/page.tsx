import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Ember",
  description: "The rules of using Ember.",
};

const UPDATED = "April 20, 2026";
const SUPPORT_EMAIL = "support@ember.app"; // update to your real address

export default function Terms() {
  return (
    <article className="prose-article">
      <div className="text-[10px] uppercase tracking-[0.25em] text-tertiary">
        Last updated · {UPDATED}
      </div>
      <h1 className="display text-primary text-4xl tracking-tight mt-1 mb-4">
        Terms of Service
      </h1>
      <p className="lede">
        Welcome to Ember. These Terms govern your use of the Ember app and
        services (&quot;Ember,&quot; &quot;we,&quot; &quot;our,&quot; or
        &quot;us&quot;). By creating an account or using Ember, you agree to
        these Terms.
      </p>

      <Section title="1. Who can use Ember">
        <p>
          You must be at least <b>13 years old</b> to use Ember. If you are
          under 18, you must have a parent or legal guardian&apos;s permission.
          You&apos;re responsible for keeping your email and sign-in link
          private and for anything that happens through your account.
        </p>
      </Section>

      <Section title="2. What Ember provides">
        <p>
          Ember is a personal fitness and wellness journal. You write
          free-text about your training, journal reflections, meals, and
          meditation sessions. Ember uses AI to parse that text into
          structured logs, shows trends, and offers optional community
          features. AI-generated summaries and insights are <b>not medical,
          psychological, financial, or legal advice</b>. Use your own judgment
          and consult a qualified professional for real health decisions.
        </p>
      </Section>

      <Section title="3. Subscriptions and billing">
        <ul>
          <li>
            Ember is free to use with basic features. Some features require
            an <b>Ember Pro</b> subscription ($6.99 / month as of the date
            above, billed monthly). Price may change with notice to you before
            your next billing cycle.
          </li>
          <li>
            New Pro subscriptions include a <b>7-day free trial</b>. You can
            cancel anytime during the trial and will not be charged. If you do
            not cancel before the trial ends, your card will be charged the
            then-current monthly rate.
          </li>
          <li>
            Payments are processed by <b>Stripe</b>. By subscribing you agree
            to Stripe&apos;s terms. You authorize us to charge your payment
            method until you cancel.
          </li>
          <li>
            You can cancel at any time from the account panel inside Ember.
            Cancellation takes effect at the end of the current billing
            period; you keep Pro access until then. We do not generally offer
            prorated refunds for unused time, but reach out to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> within 24
            hours of a charge and we&apos;ll refund you.
          </li>
        </ul>
      </Section>

      <Section title="4. Your content">
        <p>
          Your journal entries, workout logs, meal logs, meditation data, and
          other content you put into Ember (&quot;Your Content&quot;) belong
          to <b>you</b>. To operate Ember we need a limited, worldwide,
          royalty-free license to store, process, transmit, and display Your
          Content to you and (only if you opt in) to other users through
          community features. This license ends when you delete the content,
          except where we need to keep it briefly to complete backups or
          comply with law.
        </p>
        <p>
          We will <b>never</b> sell Your Content, train public AI models on
          it, or share individual entries with other users. See the{" "}
          <Link href="/legal/privacy">Privacy Policy</Link> for details on
          what we do process.
        </p>
      </Section>

      <Section title="5. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>
            Use Ember to harass, threaten, defame, or harm any other person;
          </li>
          <li>
            Post content in community features (display name, bio) that is
            unlawful, sexually explicit, hateful, or impersonates someone
            else;
          </li>
          <li>
            Attempt to reverse-engineer, scrape, overload, or disrupt Ember or
            the servers/services it depends on;
          </li>
          <li>
            Share, resell, or transfer your account to anyone else;
          </li>
          <li>
            Use Ember in violation of any applicable law.
          </li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these rules,
          without refund for any Pro time misused.
        </p>
      </Section>

      <Section title="6. Community features">
        <p>
          If you turn on <i>Discoverable</i>, your display name, bio, and top
          journal themes (aggregate keyword counts, not entries) become
          visible to other signed-in Ember users. You can turn it off at any
          time. We can remove any user-visible content that violates Section
          5.
        </p>
      </Section>

      <Section title="7. Third-party services">
        <p>
          Ember runs on and integrates with third-party services including{" "}
          <b>Supabase</b> (auth + database), <b>Vercel</b> (hosting),{" "}
          <b>Stripe</b> (payments), and <b>Anthropic</b> (Claude AI). By using
          Ember you accept that your data passes through these providers
          according to their respective terms. We select providers we believe
          are reputable, but we do not control them.
        </p>
      </Section>

      <Section title="8. Termination and deletion">
        <p>
          You can delete your data at any time from the account panel
          (&quot;Delete all data&quot;). To fully delete your account, email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>; we&apos;ll
          action it within 30 days. We can terminate your account for serious
          or repeated violations of these Terms, with or without notice.
        </p>
      </Section>

      <Section title="9. Disclaimers">
        <p>
          Ember is provided <b>&quot;as is&quot; and &quot;as available.&quot;</b>{" "}
          We do not warrant that it will be uninterrupted, error-free, or
          fit for a particular purpose. AI-generated parses, insights, and
          recommendations may be wrong — you should double-check anything
          important. Ember is <b>not a medical device</b> and makes no health
          claims.
        </p>
      </Section>

      <Section title="10. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Ember and its operator will
          not be liable for indirect, incidental, special, consequential, or
          punitive damages, or for any loss of profits, data, or goodwill.
          Our total aggregate liability for any claim relating to Ember is
          limited to the greater of <b>$50 USD</b> or the amount you paid us
          in the <b>12 months</b> prior to the event giving rise to the claim.
        </p>
      </Section>

      <Section title="11. Changes to these Terms">
        <p>
          We may update these Terms from time to time. If a change is
          material, we&apos;ll let you know by email or an in-app notice
          before it takes effect. Continued use of Ember after the effective
          date means you accept the updated Terms.
        </p>
      </Section>

      <Section title="12. Governing law">
        <p>
          These Terms are governed by the laws of the State of Delaware,
          United States, without regard to conflict-of-law principles.
          Disputes will be resolved in the state or federal courts located in
          Delaware, and you consent to personal jurisdiction there.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>
          Questions about these Terms? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </Section>

      <div
        className="mt-12 p-4 rounded-xl text-[12px] text-tertiary leading-relaxed"
        style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-soft)" }}
      >
        <b>Note:</b> This document is a plain-English draft intended for a
        small, early-stage service. It is not a substitute for legal advice
        tailored to your jurisdiction and business. Have a lawyer review
        before you scale or accept material revenue.
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="display text-primary text-xl tracking-tight mb-3">{title}</h2>
      <div className="text-[14px] text-secondary leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}
