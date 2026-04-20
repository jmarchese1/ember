"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Check,
  X,
  Sparkles,
  Globe,
  Lock,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import {
  cloudGetMyPublicProfile,
  cloudUpsertMyPublicProfile,
  cloudFetchDiscoverable,
  cloudFetchFriendships,
  cloudRequestFriend,
  cloudRespondToFriend,
  cloudRemoveFriendship,
  type PublicProfile,
  type Friendship,
} from "@/lib/cloud";
import { computeTopThemes } from "@/lib/storage";
import { Card, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "./ui/toast";
import { EmptyState } from "./empty-state";

export function CommunityTab({ refreshKey }: { refreshKey: number }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<PublicProfile | null>(null);
  const [others, setOthers] = useState<PublicProfile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [bumpKey, setBumpKey] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const { data: u } = await supabase().auth.getUser();
      const uid = u?.user?.id;
      if (!uid) return;
      setUserId(uid);

      // Make sure our own public profile exists with fresh top_themes.
      let me = await cloudGetMyPublicProfile(uid);
      const freshThemes = computeTopThemes(8);
      if (!me) {
        await cloudUpsertMyPublicProfile(uid, {
          discoverable: false,
          top_themes: freshThemes,
        });
        me = await cloudGetMyPublicProfile(uid);
      } else if (JSON.stringify(me.top_themes) !== JSON.stringify(freshThemes)) {
        await cloudUpsertMyPublicProfile(uid, { top_themes: freshThemes });
        me = { ...me, top_themes: freshThemes };
      }
      setMyProfile(me);

      const [disc, fr] = await Promise.all([
        cloudFetchDiscoverable(uid),
        cloudFetchFriendships(uid),
      ]);
      setOthers(disc);
      setFriendships(fr);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey, bumpKey]);

  const byUser = useMemo(() => {
    const m = new Map<string, PublicProfile>();
    for (const p of others) m.set(p.user_id, p);
    return m;
  }, [others]);

  const myThemes = new Set(myProfile?.top_themes ?? []);

  // Split friendships into buckets relative to me
  const accepted = friendships.filter((f) => f.status === "accepted");
  const pendingIncoming = friendships.filter(
    (f) => f.status === "pending" && f.recipient === userId
  );
  const pendingOutgoing = friendships.filter(
    (f) => f.status === "pending" && f.requester === userId
  );

  const involvedIds = new Set<string>();
  for (const f of friendships) {
    involvedIds.add(f.requester);
    involvedIds.add(f.recipient);
  }

  // Suggestions = discoverable profiles I'm NOT already connected/requested with,
  // sorted by theme overlap (Jaccard).
  const suggestions = useMemo(() => {
    const scored = others
      .filter((p) => !involvedIds.has(p.user_id))
      .map((p) => {
        const them = new Set(p.top_themes ?? []);
        const inter = [...them].filter((t) => myThemes.has(t)).length;
        const union = new Set([...them, ...myThemes]).size || 1;
        const score = inter / union;
        const shared = [...them].filter((t) => myThemes.has(t));
        return { profile: p, score, shared };
      })
      .sort((a, b) => b.score - a.score);
    return scored;
  }, [others, involvedIds, myThemes]);

  async function sendRequest(otherId: string) {
    if (!userId) return;
    const r = await cloudRequestFriend(userId, otherId);
    if (r.ok) {
      toast("Friend request sent.");
      setBumpKey((k) => k + 1);
    } else {
      toast(r.error || "Could not send request.");
    }
  }

  async function respond(requesterId: string, accept: boolean) {
    if (!userId) return;
    const r = await cloudRespondToFriend(userId, requesterId, accept);
    if (r.ok) {
      toast(accept ? "Friend added." : "Request declined.");
      setBumpKey((k) => k + 1);
    } else toast(r.error || "Could not update request.");
  }

  async function remove(otherId: string) {
    if (!userId) return;
    await cloudRemoveFriendship(userId, otherId);
    setBumpKey((k) => k + 1);
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <div
          className="w-8 h-8 rounded-full animate-pulse"
          style={{ background: "var(--accent-soft)" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 rise">
      {/* Your profile */}
      <ProfileCard
        profile={myProfile}
        onChange={async (patch) => {
          if (!userId) return;
          await cloudUpsertMyPublicProfile(userId, patch);
          setBumpKey((k) => k + 1);
        }}
      />

      {/* Pending incoming */}
      {pendingIncoming.length > 0 && (
        <Card>
          <CardHeader
            title="Friend requests"
            subtitle={`${pendingIncoming.length} waiting on you`}
          />
          <div className="space-y-2">
            {pendingIncoming.map((f) => {
              const p = byUser.get(f.requester);
              return (
                <div
                  key={f.requester}
                  className="p-3 rounded-lg flex items-center justify-between gap-3"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <PersonBadge profile={p} fallbackId={f.requester} />
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      onClick={() => respond(f.requester, false)}
                      icon={<X size={13} />}
                    >
                      Decline
                    </Button>
                    <Button
                      onClick={() => respond(f.requester, true)}
                      icon={<Check size={13} />}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Friends */}
      <Card>
        <CardHeader
          title="Friends"
          subtitle={
            accepted.length
              ? `${accepted.length} connection${accepted.length === 1 ? "" : "s"}`
              : "No friends yet — add someone below"
          }
        />
        {accepted.length === 0 ? (
          <p className="text-sm text-tertiary">
            Once you're discoverable and connect with someone, they'll appear here.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {accepted.map((f) => {
              const other = f.requester === userId ? f.recipient : f.requester;
              const p = byUser.get(other);
              return (
                <div
                  key={other}
                  className="p-3 rounded-lg flex items-center justify-between gap-3"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-soft)",
                  }}
                >
                  <PersonBadge profile={p} fallbackId={other} />
                  <button
                    onClick={() => remove(other)}
                    className="text-[11px] text-tertiary hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Suggested */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-tertiary">
              Suggested
            </div>
            <h2 className="display text-primary text-xl tracking-tight mt-1">
              Kindred spirits
            </h2>
          </div>
          <div className="text-[11px] text-tertiary">
            matched by shared journal themes
          </div>
        </div>

        {!myProfile?.discoverable && (
          <div
            className="mb-4 p-4 rounded-xl flex items-start gap-3"
            style={{
              background: "var(--accent-soft)",
              border: "1px solid transparent",
            }}
          >
            <Lock size={16} className="text-accent-hover shrink-0 mt-0.5" />
            <div className="text-[13px] leading-snug" style={{ color: "var(--accent-hover)" }}>
              You&apos;re hidden from search. Turn on <b>Discoverable</b> in your
              profile above to appear in other people&apos;s suggestions too.
            </div>
          </div>
        )}

        {suggestions.length === 0 ? (
          <EmptyState
            icon={<Users size={20} />}
            title="No one to suggest yet"
            body="The directory is quiet. As more people turn on discoverability, kindred spirits will surface here — matched by the themes that show up in your journal."
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {suggestions.slice(0, 12).map(({ profile, score, shared }) => {
              const outgoing = pendingOutgoing.some(
                (f) => f.recipient === profile.user_id
              );
              return (
                <SuggestionCard
                  key={profile.user_id}
                  profile={profile}
                  score={score}
                  shared={shared}
                  requested={outgoing}
                  onRequest={() => sendRequest(profile.user_id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {pendingOutgoing.length > 0 && (
        <Card>
          <CardHeader
            title="Awaiting reply"
            subtitle={`${pendingOutgoing.length} request${pendingOutgoing.length === 1 ? "" : "s"} pending`}
          />
          <div className="space-y-2">
            {pendingOutgoing.map((f) => {
              const p = byUser.get(f.recipient);
              return (
                <div
                  key={f.recipient}
                  className="p-3 rounded-lg flex items-center justify-between gap-3"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <PersonBadge profile={p} fallbackId={f.recipient} />
                  <span className="text-[11px] text-tertiary inline-flex items-center gap-1">
                    <Clock size={11} /> pending
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============ Sub-components ============ */

function ProfileCard({
  profile,
  onChange,
}: {
  profile: PublicProfile | null;
  onChange: (patch: Partial<PublicProfile>) => Promise<void>;
}) {
  const [name, setName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [discoverable, setDiscoverable] = useState(profile?.discoverable ?? false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.display_name ?? "");
    setBio(profile?.bio ?? "");
    setDiscoverable(profile?.discoverable ?? false);
  }, [profile]);

  async function save(patch: Partial<PublicProfile>) {
    setSaving(true);
    try {
      await onChange(patch);
    } finally {
      setSaving(false);
    }
  }

  async function toggleDiscoverable() {
    const next = !discoverable;
    setDiscoverable(next);
    await save({ discoverable: next });
  }

  return (
    <Card>
      <CardHeader
        title="Your community profile"
        subtitle="Only your display name, bio, and top journal themes are visible to others. Never your entries."
        right={
          <button
            onClick={toggleDiscoverable}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-widest font-semibold transition-all"
            style={{
              background: discoverable
                ? "linear-gradient(135deg, var(--accent), var(--accent-hover))"
                : "var(--bg-subtle)",
              color: discoverable ? "#fff" : "var(--text-tertiary)",
              border: `1px solid ${discoverable ? "transparent" : "var(--border-soft)"}`,
            }}
            title={discoverable ? "You're visible to others" : "You're hidden"}
          >
            {discoverable ? <Globe size={11} /> : <Lock size={11} />}
            {discoverable ? "Discoverable" : "Hidden"}
          </button>
        }
      />

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest text-tertiary mb-1">
            Display name
          </div>
          <input
            className="input"
            placeholder="How others see you"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => save({ display_name: name.trim() || null })}
          />
        </label>
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest text-tertiary mb-1">
            Bio
          </div>
          <input
            className="input"
            placeholder="One sentence about what you&apos;re after"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            onBlur={() => save({ bio: bio.trim() || null })}
          />
        </label>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-tertiary mb-2">
          Your top themes
          <span className="ml-2 text-tertiary normal-case tracking-normal text-[10px]">
            (updates automatically when you journal)
          </span>
        </div>
        {(profile?.top_themes ?? []).length === 0 ? (
          <p className="text-[12px] text-tertiary italic">
            Journal a few entries and your themes will appear here — these are
            what we use to suggest kindred spirits below.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {profile!.top_themes.map((t) => (
              <span
                key={t}
                className="inline-flex px-2.5 py-1 rounded-full text-[11.5px] capitalize font-medium"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent-hover)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {saving && (
        <div className="text-[10px] text-tertiary mt-3">Saving…</div>
      )}
    </Card>
  );
}

function SuggestionCard({
  profile,
  score,
  shared,
  requested,
  onRequest,
}: {
  profile: PublicProfile;
  score: number;
  shared: string[];
  requested: boolean;
  onRequest: () => void;
}) {
  const pct = Math.round(score * 100);
  const initials = initialsFrom(profile.display_name || profile.user_id);
  return (
    <div
      className="card p-4 flex flex-col gap-3 card-hover"
      style={{ borderColor: "var(--border-soft)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full grid place-items-center shrink-0 text-[12px] font-semibold"
          style={{ background: "var(--accent-soft)", color: "var(--accent-hover)" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-sm font-semibold text-primary truncate">
              {profile.display_name || "Anonymous"}
            </div>
            {pct > 0 && (
              <span
                className="text-[10px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent-hover)",
                }}
              >
                {pct}% match
              </span>
            )}
          </div>
          {profile.bio && (
            <div className="text-[12px] text-secondary leading-snug mt-0.5 line-clamp-2">
              {profile.bio}
            </div>
          )}
        </div>
      </div>
      {shared.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-tertiary mb-1">
            Shared themes
          </div>
          <div className="flex flex-wrap gap-1">
            {shared.slice(0, 6).map((t) => (
              <span
                key={t}
                className="text-[11px] px-2 py-0.5 rounded-full capitalize"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent-hover)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
      <Button
        onClick={onRequest}
        disabled={requested}
        variant={requested ? "soft" : "primary"}
        icon={requested ? <Check size={13} /> : <UserPlus size={13} />}
        className="w-full !justify-center"
      >
        {requested ? "Requested" : "Add friend"}
      </Button>
    </div>
  );
}

function PersonBadge({
  profile,
  fallbackId,
}: {
  profile?: PublicProfile;
  fallbackId: string;
}) {
  const name = profile?.display_name || "Anonymous";
  const initials = initialsFrom(profile?.display_name || fallbackId);
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className="w-9 h-9 rounded-full grid place-items-center shrink-0 text-[11px] font-semibold"
        style={{ background: "var(--accent-soft)", color: "var(--accent-hover)" }}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-primary truncate">{name}</div>
        {profile?.bio && (
          <div className="text-[12px] text-tertiary truncate">{profile.bio}</div>
        )}
        {profile && profile.top_themes.length > 0 && !profile.bio && (
          <div className="text-[11px] text-tertiary truncate">
            {profile.top_themes.slice(0, 3).join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}

function initialsFrom(src: string): string {
  const s = (src || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/);
  if (parts.length === 1) return s[0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
