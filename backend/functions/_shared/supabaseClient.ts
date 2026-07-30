import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

// 요청자의 JWT를 그대로 전달하는 클라이언트: RLS가 호출자 권한으로 적용됨
export function getUserClient(req: Request): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      auth: { persistSession: false },
    },
  );
}

export async function getAuthenticatedUser(req: Request, client: SupabaseClient) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user;
}
