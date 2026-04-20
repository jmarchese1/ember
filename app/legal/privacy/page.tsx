import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Ember",
  description: "What Ember does with your data.",
};

const UPDATED = "April 20, 2026";
const SUPPORT_EMAIL = "support@ember.app";

export default function Privacy() {
  return (
    <article className="prose-article">
      <div className="text-[10px] uppercase tracking-[0.25em] text-tertiary">
        Last updated · {UPDATED}
      </div>
      <h1 className="display text-primary text-4xl tracking-tight mt-1 mb-4">
        Privacy Policy
      </h1>
      <p className="lede">
        Ember is a personal journal. Your entries are personal. This policy
        explains what we collect, why, who we share it with (short list), and
        how to get rid of it.
      </p>

      <Section title="1. What we collect">
        <p>When you use Ember, we collect:</p>
        <ul>
          <li>
            <b>Account data</b> — your email address (used for sign-in via
            magic link / one-time code).
          </li>
          <li>
            <b>Profile data</b> — optional: display name, goals, bio, theme
            preferences.
          </li>
          <li>
            <b>Your Content</b> — the free-text you write about workouts,
            journal reflections, meals, and meditation, plus the structured
            data the AI parses from it.
          </li>
          <li>
            <b>Usage + device</b> — basic server logs (IP, timestamp, browser
            agent) and PWA install state, retained for debugging and abuse
            prevention.
          </li>
          <li>
            <b>Billing</b> — if you subscribe to Pro: your Stripe customer ID,
            subscription status, and billing history. We do{" "}
            <b>not store your card number</b> — Stripe does.
          </li>
        </ul>
      </Section>

      <Section title="2. How we use it">
        <ul>
          <li>
            To run Ember: parse your logs, show trends, run streaks, generate
            weekly reflections.
          </li>
          <li>
            To authenticate you and keep your account secure.
          </li>
          <li>
            To process payments via Stripe.
          </li>
          <li>
            To suggest friends (community feature) — based only on your{" "}
            <b>aggregated journal themes</b> (e.g. &quot;work, focus, family&quot;),
            never on your entries themselves.
          </li>
          <li>
            To contact you about your account or material changes to the
            service.
          </li>
        </ul>
        <p>
          We do <b>not</b> sell your personal data, we do <b>not</b> serve
          third-party ads, and we do <b>not</b> train public AI models on
          your content.
        </p>
      </Section>

      <Section title="3. Who we share data with">
        <p>
          To run Ember we send data to a small set of providers who act as our
          processors under their own published terms:
        </p>
        <ul>
          <li>
            <b>Supabase</b> — authentication and database hosting for your
            profile and logs.
          </li>
          <li>
            <b>Vercel</b> — hosting the Ember web app.
          </li>
          <li>
            <b>Anthropic</b> — receives the free-text you submit in order to
            return structured data (workout/diet/journal parses + weekly
            summaries). Per Anthropic&apos;s API terms, your inputs are{" "}
            <b>not used to train</b> their public models.
          </li>
          <li>
            <b>Stripe</b> — handles card payments and billing portal. Stripe
            receives your email, billing address, and payment details; we
            only receive an anonymous customer ID.
          </li>
        </ul>
        <p>
          We may also disclose data if required by a valid legal process, or
          to prevent fraud or imminent harm to a person.
        </p>
      </Section>

      <Section title="4. Community features">
        <p>
          When you opt into <i>Discoverable</i>, these things become visible
          to other signed-in Ember users: your chosen display name, bio, and
          your top ~8 journal themes (keyword counts, not your entries).
          Nothing else — no workouts, no meals, no mood, no reflections.
          Turning Discoverable off removes you from suggestions immediately,
          and existing friends see only the profile fields you still have set.
        </p>
      </Section>

      <Section title="5. How long we keep data">
        <p>
          Your data is retained as long as your account is active. You can
          delete all of it from the account panel (<i>&quot;Delete all
          data&quot;</i>) at any time, which wipes entries + profile from our
          database and clears local device storage. Backups are rotated out
          within 30 days. Billing records are kept as long as required by tax
          law (typically 7 years).
        </p>
      </Section>

      <Section title="6. Your rights">
        <p>You can at any time:</p>
        <ul>
          <li>
            <b>Access &amp; export</b> all your data as JSON from the account
            panel (&quot;Export everything&quot;).
          </li>
          <li>
            <b>Delete</b> all your entries and profile data from the account
            panel.
          </li>
          <li>
            <b>Fully delete</b> your account — email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We&apos;ll
            action it within 30 days.
          </li>
          <li>
            <b>Object or restrict</b> processing, or request a machine-readable
            copy — email us.
          </li>
        </ul>
        <p>
          If you are in the EEA/UK (GDPR) or California (CCPA/CPRA), these
          rights apply to you and we will respond within the statutory time
          limits.
        </p>
      </Section>

      <Section title="7. Security">
        <p>
          We use HTTPS everywhere, row-level security in the database (you can
          only read rows belonging to your own account), short-lived magic-link
          tokens, and no password storage on our side. No system is perfectly
          secure; if we discover a breach that affects your data, we&apos;ll
          notify you and, where required, the relevant regulator.
        </p>
      </Section>

      <Section title="8. Children">
        <p>
          Ember is not intended for children under <b>13</b>. We do not
          knowingly collect data from anyone under 13. If you believe a child
          has given us data, email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we will
          delete it.
        </p>
      </Section>

      <Section title="9. Local storage">
        <p>
          Ember uses your browser&apos;s <code>localStorage</code> to cache
          your logs so the app works offline and loads instantly. This data
          is namespaced to your user ID, cleared on sign-out, and is not a
          cookie (no advertising use). Registering Ember as a PWA stores
          additional static files so the app opens without a network
          connection.
        </p>
      </Section>

      <Section title="10. International transfers">
        <p>
          Our primary servers are located in the United States. By using
          Ember you consent to your data being transferred to and processed
          in the US under the contractual safeguards each processor
          maintains.
        </p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          We may update this policy from time to time. Material changes will
          be announced by email or in-app notice before they take effect.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          Questions? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.{" "}
          <Link href="/legal/terms">Terms of Service</Link>.
        </p>
      </Section>

      <div
        className="mt-12 p-4 rounded-xl text-[12px] text-tertiary leading-relaxed"
        style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-soft)" }}
      >
        <b>Note:</b> This policy is a plain-English draft. Have a lawyer
        adapt it to your jurisdiction and business structure before scaling.
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
