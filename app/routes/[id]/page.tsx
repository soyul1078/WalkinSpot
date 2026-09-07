"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getMockRouteById, type Checkpoint, type LatLng, type Route } from "@/lib/mockRoutes";
import { estimateCalories } from "@/lib/geo";
import { useGpsTracker } from "@/lib/hooks/useGpsTracker";
import type { User } from "@supabase/supabase-js";

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

type RouteDetail = Route;

export default function RouteDetailPage() {
  const params = useParams<{ id: string }>();
  const routeId = params.id;

  const [route, setRoute] = useState<RouteDetail | null>(getMockRouteById(routeId) ?? null);
  const [loading, setLoading] = useState(!route);
  const [notFound, setNotFound] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const gpsTracker = useGpsTracker(route?.checkpoints ?? []);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      if (!route) setNotFound(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase
      .from("routes")
      .select(
        "id, title, description, category_tag, distance, estimated_time, difficulty, path_coordinates, checkpoints(name, latitude, longitude)",
      )
      .eq("id", routeId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const checkpoints: Checkpoint[] = (data.checkpoints ?? []).map(
            (cp: { name: string; latitude: number; longitude: number }) => ({
              name: cp.name,
              lat: cp.latitude,
              lng: cp.longitude,
            }),
          );
          setRoute({
            id: data.id,
            title: data.title,
            description: data.description,
            category_tag: data.category_tag,
            distance: data.distance,
            estimated_time: data.estimated_time,
            difficulty: data.difficulty,
            path_coordinates: (data.path_coordinates as LatLng[]) ?? [],
            checkpoints,
          });
        } else if (!route) {
          setNotFound(true);
        }
        setLoading(false);
      });

    return () => subscription.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  // 완주 시 자동으로 모달 표시
  useEffect(() => {
    if (gpsTracker.isRouteComplete && gpsTracker.isTracking) {
      setShowCompleteModal(true);
    }
  }, [gpsTracker.isRouteComplete, gpsTracker.isTracking]);

  async function handleCompleteRoute() {
    if (!user || !route) return;

    try {
      // 스탬프 기록
      await supabase?.from("stamps_logs").insert({
        user_id: user.id,
        route_id: route.id,
        completed_at: new Date().toISOString(),
        is_valid: true,
      });

      // 완주 기록
      await supabase?.from("route_completions").insert({
        user_id: user.id,
        route_id: route.id,
        completed_at: new Date().toISOString(),
        completed_checkpoint_count: gpsTracker.completedCheckpoints.size,
      });

      gpsTracker.stopTracking();
      setShowCompleteModal(false);
    } catch (error) {
      console.error("완주 기록 중 오류:", error);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center bg-white">
        <p className="text-sm text-neutral-400">불러오는 중...</p>
      </main>
    );
  }

  if (notFound || !route) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-3 bg-white px-5 text-center">
        <p className="text-sm text-neutral-500">코스를 찾을 수 없어요.</p>
        <Link href="/" className="text-sm font-semibold text-brand-600">
          홈으로 돌아가기
        </Link>
      </main>
    );
  }

  const calories = estimateCalories(route.category_tag, route.estimated_time);

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white pb-10 shadow-sm relative">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-neutral-100 bg-white/90 px-5 py-4 backdrop-blur">
        <Link href="/" className="text-neutral-500 hover:text-neutral-700" aria-label="뒤로가기">
          ←
        </Link>
        <h1 className="truncate text-base font-bold">{route.title}</h1>
      </header>

      <div className="px-5 pt-4">
        <RouteMap path={route.path_coordinates} checkpoints={route.checkpoints} />
      </div>

      <section className="px-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
            #{route.category_tag}
          </span>
          <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
            {route.difficulty}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">{route.description}</p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-neutral-50 p-4 text-center">
            <p className="text-lg font-bold text-neutral-900">{route.distance}km</p>
            <p className="mt-1 text-xs text-neutral-500">거리</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-4 text-center">
            <p className="text-lg font-bold text-neutral-900">{route.estimated_time}분</p>
            <p className="mt-1 text-xs text-neutral-500">예상 소요</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-4 text-center">
            <p className="text-lg font-bold text-neutral-900">{calories}kcal</p>
            <p className="mt-1 text-xs text-neutral-500">예상 소모</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-neutral-400">
          * 칼로리는 평균 체중(65kg) 기준 예상치예요. 로그인 후 프로필에 체중을 입력하면 더 정확해져요.
        </p>

        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold text-neutral-400">체크포인트 ({route.checkpoints.length})</p>
          <ol className="flex flex-col gap-2">
            {route.checkpoints.map((cp, i) => (
              <li
                key={cp.name}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                  gpsTracker.completedCheckpoints.has(cp.name)
                    ? "border-brand-200 bg-brand-50"
                    : "border-neutral-100 bg-white"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    gpsTracker.completedCheckpoints.has(cp.name)
                      ? "bg-brand-500 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {gpsTracker.completedCheckpoints.has(cp.name) ? "✓" : i + 1}
                </span>
                <span className={gpsTracker.completedCheckpoints.has(cp.name) ? "text-brand-700 font-medium" : ""}>
                  {cp.name}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {!gpsTracker.isTracking ? (
          <button
            onClick={() => gpsTracker.startTracking()}
            className="mt-6 w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            이 코스로 산책 시작하기
          </button>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="rounded-xl bg-brand-50 border border-brand-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                <p className="text-sm font-semibold text-brand-700">산책 중...</p>
              </div>
              {gpsTracker.currentPosition && (
                <p className="text-xs text-brand-600">
                  위치: {gpsTracker.currentPosition.lat.toFixed(4)}, {gpsTracker.currentPosition.lng.toFixed(4)}
                </p>
              )}
            </div>
            <button
              onClick={() => gpsTracker.stopTracking()}
              className="w-full rounded-xl bg-neutral-200 py-3 text-sm font-bold text-neutral-600 transition hover:bg-neutral-300"
            >
              산책 중단하기
            </button>
          </div>
        )}

        {gpsTracker.error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-4">
            <p className="text-xs font-semibold text-rose-700 mb-2">⚠️ GPS 오류</p>
            <p className="text-xs text-rose-600">{gpsTracker.error}</p>
            {gpsTracker.permissionDenied && (
              <p className="text-xs text-rose-600 mt-2">
                설정에서 위치 권한을 허용한 후 페이지를 새로고침해주세요.
              </p>
            )}
          </div>
        )}
      </section>

      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-center">
              <p className="text-4xl mb-3">🎉</p>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">산책 완주!</h2>
              <p className="text-sm text-neutral-600 mb-4">
                모든 체크포인트를 달성했어요! 축하합니다! 🏆
              </p>
              <div className="bg-brand-50 rounded-xl p-4 mb-5">
                <p className="text-xs text-neutral-500 mb-1">달성한 체크포인트</p>
                <p className="text-lg font-bold text-brand-700">
                  {gpsTracker.completedCheckpoints.size}/{route.checkpoints.length}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {user ? (
                <>
                  <button
                    onClick={handleCompleteRoute}
                    className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 transition"
                  >
                    산책 완료 저장
                  </button>
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    className="w-full rounded-xl border border-neutral-200 bg-white py-3 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition"
                  >
                    계속 산책하기
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-center text-neutral-500 mb-2">
                    로그인하면 완주 기록이 저장됩니다
                  </p>
                  <button
                    onClick={() => window.location.href = "/"}
                    className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 transition"
                  >
                    홈으로 돌아가기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
