// GET  /routes?category=&distance_max=   코스 목록 조회
// GET  /routes/{id}                      코스 상세 조회 (체크포인트 포함)
// POST /routes                           코스 등록
// POST /routes/{id}/checkpoints          체크포인트 등록
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getUserClient } from "../_shared/supabaseClient.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const routesIndex = segments.indexOf("routes");
  const routeId = segments[routesIndex + 1];
  const subResource = segments[routesIndex + 2];

  const supabase = getUserClient(req);

  try {
    if (req.method === "GET" && !routeId) {
      const category = url.searchParams.get("category");
      const distanceMax = url.searchParams.get("distance_max");

      let query = supabase.from("routes").select("*").eq("is_public", true);
      if (category) query = query.eq("category_tag", category);
      if (distanceMax) query = query.lte("distance", Number(distanceMax));

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return jsonResponse(data);
    }

    if (req.method === "GET" && routeId && !subResource) {
      const { data, error } = await supabase
        .from("routes")
        .select("*, checkpoints(*)")
        .eq("id", routeId)
        .single();
      if (error) throw error;
      return jsonResponse(data);
    }

    if (req.method === "POST" && !routeId) {
      const user = await getAuthenticatedUser(req, supabase);
      if (!user) return jsonResponse({ error: "인증이 필요합니다." }, 401);

      const body = await req.json();
      const { title, description, category_tag, distance, estimated_time, difficulty, path_coordinates, cover_image_url } = body;
      if (!title || !distance) {
        return jsonResponse({ error: "title, distance는 필수입니다." }, 400);
      }

      const { data, error } = await supabase
        .from("routes")
        .insert({
          creator_id: user.id,
          title,
          description,
          category_tag,
          distance,
          estimated_time,
          difficulty,
          path_coordinates,
          cover_image_url,
        })
        .select()
        .single();
      if (error) throw error;
      return jsonResponse(data, 201);
    }

    if (req.method === "POST" && routeId && subResource === "checkpoints") {
      const user = await getAuthenticatedUser(req, supabase);
      if (!user) return jsonResponse({ error: "인증이 필요합니다." }, 401);

      const body = await req.json();
      const { name, description, latitude, longitude, order_index, radius_meters } = body;
      if (latitude === undefined || longitude === undefined || order_index === undefined) {
        return jsonResponse({ error: "latitude, longitude, order_index는 필수입니다." }, 400);
      }

      const { data, error } = await supabase
        .from("checkpoints")
        .insert({
          route_id: routeId,
          name,
          description,
          latitude,
          longitude,
          order_index,
          radius_meters: radius_meters ?? 50,
        })
        .select()
        .single();
      if (error) throw error;
      return jsonResponse(data, 201);
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
