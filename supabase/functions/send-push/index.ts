// =============================================================================
// Edge Function: send-push
// =============================================================================
// Delivers a push notification to a user's device via the Expo Push API.
// Looks up the stored Expo push token from the profile and forwards the
// message. Invoked internally by dispatch-ride and ride state-transition hooks.
// =============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushBody {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const body = (await req.json()) as PushBody;
  if (!body.user_id) return json({ error: "user_id required" }, 400);

  const { data: profile } = await admin
    .from("profiles")
    .select("push_token")
    .eq("id", body.user_id)
    .single();

  if (!profile?.push_token) return json({ skipped: "no push token" });

  const message = {
    to: profile.push_token,
    sound: "default",
    title: body.title,
    body: body.body,
    data: body.data ?? {},
    priority: "high",
    channelId: "rides",
  };

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  const result = await res.json();
  return json({ delivered: res.ok, expo: result }, res.ok ? 200 : 502);
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
