// GET /users/{id}          사용자 프로필 조회
// GET /users/{id}/stats    사용자 통계 (거리, 스탬프, 쿠폰, 배지)
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getUserClient } from "../_shared/supabaseClient.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "GET") {
    return jsonResponse({ error: "Not found" }, 404);
  }

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const resourceIndex = segments.indexOf("users");
  const userId = segments[resourceIndex + 1];
  const subResource = segments[resourceIndex + 2];

  if (!userId) return jsonResponse({ error: "user id는 필수입니다." }, 400);

  const supabase = getUserClient(req);

  try {
    if (!subResource) {
      const { data, error } = await supabase
        .from("users")
        .select("id, nickname, profile_img_url, total_distance, total_stamps, created_at")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return jsonResponse(data);
    }

    if (subResource === "stats") {
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("total_distance, total_stamps")
        .eq("id", userId)
        .single();
      if (userError) throw userError;

      const { count: couponsCount } = await supabase
        .from("user_coupons")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      const { data: badgeRows } = await supabase
        .from("user_badges")
        .select("acquired_at, badges(id, name, description, image_url)")
        .eq("user_id", userId);

      return jsonResponse({
        total_distance: userRow.total_distance,
        total_stamps: userRow.total_stamps,
        coupons_count: couponsCount ?? 0,
        badges: badgeRows ?? [],
      });
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
