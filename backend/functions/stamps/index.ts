// POST /stamps   GPS 기반 체크포인트 스탬프 획득 (반경/속도 검증 + 코스 완주 시 쿠폰 자동 발급)
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getUserClient } from "../_shared/supabaseClient.ts";
import { distanceMeters, MAX_VALID_SPEED_KMH } from "../_shared/geo.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Not found" }, 404);
  }

  const supabase = getUserClient(req);
  const user = await getAuthenticatedUser(req, supabase);
  if (!user) return jsonResponse({ error: "인증이 필요합니다." }, 401);

  try {
    const body = await req.json();
    const { route_id, checkpoint_id, user_latitude, user_longitude, average_speed } = body;
    if (!route_id || !checkpoint_id || user_latitude === undefined || user_longitude === undefined) {
      return jsonResponse({ error: "route_id, checkpoint_id, user_latitude, user_longitude는 필수입니다." }, 400);
    }

    const { data: checkpoint, error: checkpointError } = await supabase
      .from("checkpoints")
      .select("id, latitude, longitude, radius_meters")
      .eq("id", checkpoint_id)
      .eq("route_id", route_id)
      .single();
    if (checkpointError || !checkpoint) {
      return jsonResponse({ error: "체크포인트를 찾을 수 없습니다." }, 404);
    }

    const distance = distanceMeters(user_latitude, user_longitude, checkpoint.latitude, checkpoint.longitude);
    const withinRadius = distance <= checkpoint.radius_meters;
    const speedExceeded = typeof average_speed === "number" && average_speed > MAX_VALID_SPEED_KMH;

    const isValid = withinRadius && !speedExceeded;
    const invalidReason = !withinRadius ? "out_of_radius" : speedExceeded ? "speed_exceeded" : null;

    const { error: insertError } = await supabase.from("stamps_logs").insert({
      user_id: user.id,
      route_id,
      checkpoint_id,
      completed_at: new Date().toISOString(),
      is_valid: isValid,
      invalid_reason: invalidReason,
      average_speed: average_speed ?? null,
    });
    if (insertError) throw insertError;

    if (!isValid) {
      return jsonResponse({
        is_valid: false,
        message: invalidReason === "speed_exceeded"
          ? "이동 속도가 너무 빨라 스탬프가 무효 처리되었습니다."
          : "체크포인트 반경 밖에 있어 스탬프를 획득할 수 없습니다.",
      });
    }

    const { count: totalCheckpoints } = await supabase
      .from("checkpoints")
      .select("id", { count: "exact", head: true })
      .eq("route_id", route_id);

    const { data: validStampedCheckpoints } = await supabase
      .from("stamps_logs")
      .select("checkpoint_id")
      .eq("user_id", user.id)
      .eq("route_id", route_id)
      .eq("is_valid", true);

    const distinctStamped = new Set((validStampedCheckpoints ?? []).map((s: { checkpoint_id: string }) => s.checkpoint_id));
    const routeCompleted = !!totalCheckpoints && distinctStamped.size >= totalCheckpoints;

    const { count: userTotalStamps } = await supabase
      .from("stamps_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_valid", true);
    await supabase.from("users").update({ total_stamps: userTotalStamps ?? 0 }).eq("id", user.id);

    let issuedCoupons: unknown[] = [];
    if (routeCompleted) {
      const { data: routeCoupons } = await supabase.from("coupons").select("id").eq("route_id", route_id);
      if (routeCoupons?.length) {
        const { data: granted } = await supabase
          .from("user_coupons")
          .upsert(
            routeCoupons.map((c: { id: string }) => ({ user_id: user.id, coupon_id: c.id })),
            { onConflict: "user_id,coupon_id", ignoreDuplicates: true },
          )
          .select();
        issuedCoupons = granted ?? [];
      }

      const { data: route } = await supabase.from("routes").select("distance").eq("id", route_id).single();
      if (route) {
        const { data: userRow } = await supabase.from("users").select("total_distance").eq("id", user.id).single();
        await supabase
          .from("users")
          .update({ total_distance: (userRow?.total_distance ?? 0) + route.distance })
          .eq("id", user.id);
      }
    }

    return jsonResponse({
      is_valid: true,
      message: "스탬프를 획득했습니다!",
      route_completed: routeCompleted,
      coupons_issued: issuedCoupons,
    });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
