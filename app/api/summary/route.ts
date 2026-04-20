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
      });
    }

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: `You are a calm, warm, thoughtful wellness companion writing a weekly reflection.
Write 3-5 short paragraphs (2-3 sentences each) summarizing the user's week across training, journaling, and diet.
- Second person, warm, grounded. No hype. No exclamation marks. No emojis.
- Be specific: reference actual exercises, meals, moods, themes from the data.
- Gentle observations over advice. End on one forward-looking line.
- Plain prose, no markdown headers.`,
      messages: [
        {
          role: "user",
          content: `User: ${name || "friend"}\n\nThis week's logs:\n${JSON.stringify(logs, null, 2)}`,
        },
      ],
    });

    const summary = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
