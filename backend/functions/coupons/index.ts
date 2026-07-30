// GET /coupons?route_id=   코스에 연결된 쿠폰 목록 조회
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getUserClient } from "../_shared/supabaseClient.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "GET") {
    return jsonResponse({ error: "Not found" }, 404);
  }

  const url = new URL(req.url);
  const routeId = url.searchParams.get("route_id");
  const supabase = getUserClient(req);

  try {
    let query = supabase.from("coupons").select("*, partner_stores(*)");
    if (routeId) query = query.eq("route_id", routeId);

    const { data, error } = await query;
    if (error) throw error;
    return jsonResponse(data);
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
