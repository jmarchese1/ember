import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { authedUser, getUserTier } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-20250514";

export async function POST(req: Request) {
  try {
    const user = await authedUser(req);
    if (!user) {
      return NextResponse.json({ error: "sign in required" }, { status: 401 });
    }

    const tier = await getUserTier(user.id);
    if (tier !== "pro") {
      return NextResponse.json(
        {
          error: "pro required",
          reason: "pro_only",
          message: "Weekly reflections are a Pro feature. Start your 7-day free trial to unlock.",
        },
        { status: 402 }
      );
    }

    const body = await req.json();
    const logs = body.logs;
    const name = body.name as string | undefined;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        summary:
          "This week you showed up. Consistency is quiet work — the kind that compounds.",
        sections: {
          opening: "This week you showed up.",
          patterns: "Consistency is quiet work.",
          wins: "You kept the flame lit.",
          closing: "Keep it small. Keep it steady.",
        },
      });
    }

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: `You are a calm, warm, thoughtful wellness companion writing a weekly reflection.
Return ONLY a JSON object with four fields. No markdown, no commentary, no code fences — pure JSON.

{
  "opening": "One sentence (10-20 words). A warm, grounded hook that captures the shape of the week.",
  "patterns": "Two sentences (30-50 words total). Specific observations from the data — actual exercises, moods, meals, themes. No advice yet.",
  "wins": "Two sentences (25-40 words total). What to quietly celebrate — the show-ups, the hard days met, the small acts of care. Never hype.",
  "closing": "One sentence (10-18 words). Forward-looking, gentle. Not a plan, a permission."
}

Tone: second-person, warm, grounded. No exclamation marks. No emojis. No metaphors about fire or flames (already overused). Specific > generic.`,
      messages: [
        {
          role: "user",
          content: `User: ${name || "friend"}\n\nThis week's logs (JSON):\n${JSON.stringify(logs, null, 2)}`,
        },
      ],
    });

    const raw = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    // Strip any stray code fences the model occasionally leaves in.
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

    type Sections = {
      opening: string;
      patterns: string;
      wins: string;
      closing: string;
    };

    let sections: Sections | null = null;
    try {
      const parsed = JSON.parse(cleaned) as Partial<Sections>;
      if (parsed.opening && parsed.patterns && parsed.wins && parsed.closing) {
        sections = {
          opening: String(parsed.opening),
          patterns: String(parsed.patterns),
          wins: String(parsed.wins),
          closing: String(parsed.closing),
        };
      }
    } catch {}

    // Backwards-compatible plain-text summary for copy-to-clipboard.
    const summary = sections
      ? `${sections.opening}\n\n${sections.patterns}\n\n${sections.wins}\n\n${sections.closing}`
      : cleaned;

    return NextResponse.json({ summary, sections });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
