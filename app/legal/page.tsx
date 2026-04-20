import Link from "next/link";
import { FileText, Shield } from "lucide-react";

export const metadata = {
  title: "Legal — Ember",
};

export default function Legal() {
  return (
    <article>
      <div className="text-[10px] uppercase tracking-[0.25em] text-tertiary">
        Legal
      </div>
      <h1 className="display text-primary text-4xl tracking-tight mt-1 mb-4">
        The boring but important stuff
      </h1>
      <p className="text-[15px] text-secondary leading-relaxed mb-8 max-w-xl">
        Plain-English drafts. Review these before you subscribe — if anything
        looks off, email{" "}
        <a href="mailto:support@ember.app" className="text-accent underline">
          support@ember.app
        </a>
        .
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <LegalLink
          href="/legal/terms"
          title="Terms of Service"
          body="The rules of using Ember — billing, acceptable use, liability, how we can end the relationship."
          icon={<FileText size={18} />}
        />
        <LegalLink
          href="/legal/privacy"
          title="Privacy Policy"
          body="What we collect, who we share with, how long we keep it, and how you delete it."
          icon={<Shield size={18} />}
        />
      </div>
    </article>
  );
}

function LegalLink({
  href,
  title,
  body,
  icon,
}: {
  href: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="card p-5 card-hover flex items-start gap-3 no-underline"
      style={{ color: "inherit" }}
    >
      <div
        className="w-10 h-10 rounded-lg grid place-items-center shrink-0"
        style={{
          background: "var(--accent-soft)",
          color: "var(--accent-hover)",
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="display text-primary text-lg tracking-tight">
          {title}
        </div>
        <div className="text-[13px] text-secondary leading-snug mt-1">
          {body}
        </div>
      </div>
    </Link>
  );
}
