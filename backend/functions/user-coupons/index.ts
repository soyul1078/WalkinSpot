// POST  /user-coupons              쿠폰 획득 (수동 발급, 통상은 stamps 완주 시 자동 발급됨)
// PATCH /user-coupons/{id}/use     쿠폰 사용 처리 (바코드/QR 제시 시)
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getUserClient } from "../_shared/supabaseClient.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const resourceIndex = segments.indexOf("user-coupons");
  const userCouponId = segments[resourceIndex + 1];
  const action = segments[resourceIndex + 2];

  const supabase = getUserClient(req);
  const user = await getAuthenticatedUser(req, supabase);
  if (!user) return jsonResponse({ error: "인증이 필요합니다." }, 401);

  try {
    if (req.method === "POST" && !userCouponId) {
      const body = await req.json();
      const { coupon_id } = body;
      if (!coupon_id) return jsonResponse({ error: "coupon_id는 필수입니다." }, 400);

      const { data, error } = await supabase
        .from("user_coupons")
        .upsert({ user_id: user.id, coupon_id }, { onConflict: "user_id,coupon_id", ignoreDuplicates: true })
        .select()
        .single();
      if (error) throw error;
      return jsonResponse(data, 201);
    }

    if (req.method === "PATCH" && userCouponId && action === "use") {
      const { data: userCoupon, error: fetchError } = await supabase
        .from("user_coupons")
        .select("id, is_used")
        .eq("id", userCouponId)
        .eq("user_id", user.id)
        .single();
      if (fetchError || !userCoupon) {
        return jsonResponse({ error: "쿠폰을 찾을 수 없습니다." }, 404);
      }
      if (userCoupon.is_used) {
        return jsonResponse({ error: "이미 사용된 쿠폰입니다." }, 409);
      }

      const { data, error } = await supabase
        .from("user_coupons")
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq("id", userCouponId)
        .select()
        .single();
      if (error) throw error;
      return jsonResponse(data);
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
