import { NextResponse } from "next/server";
import { authedUser, getUserTier, getFreeAiUsage } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const user = await authedUser(req);
  if (!user) {
    return NextResponse.json({ error: "sign in required" }, { status: 401 });
  }
  const tier = await getUserTier(user.id);
  if (tier === "pro") {
    return NextResponse.json({ tier, used: 0, limit: null });
  }
  const { used, limit } = await getFreeAiUsage(user.id);
  return NextResponse.json({ tier, used, limit });
}
