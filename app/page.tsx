"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { categoryTags, mockRoutes, type Route } from "@/lib/mockRoutes";
import { distanceMeters } from "@/lib/geo";
import LoginModal from "@/components/LoginModal";

const difficultyStyle: Record<string, string> = {
  쉬움: "bg-brand-100 text-brand-700",
  보통: "bg-amber-100 text-amber-700",
  어려움: "bg-rose-100 text-rose-700",
};

export default function Home() {
  const [routes, setRoutes] = useState<Route[]>(mockRoutes);
  const [activeTag, setActiveTag] = useState("전체");
  const [showLogin, setShowLogin] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "denied">("idle");

  // 코스 목록 로드 (Supabase 연결 안 됐으면 목 데이터 유지)
  useEffect(() => {
    if (!supabase) return;

    supabase
      .from("routes")
      .select("id, title, description, category_tag, distance, estimated_time, difficulty, path_coordinates")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setRoutes(data.map((r) => ({ ...r, checkpoints: [] })) as Route[]);
        }
      });
  }, []);

  // 로그인 상태 추적
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  // 로그인한 사용자의 완주 진행률 (유효 스탬프 기준 완주한 코스 수)
  useEffect(() => {
    if (!supabase || !user) {
      setCompletedCount(0);
      return;
    }
    supabase
      .from("stamps_logs")
      .select("route_id")
      .eq("user_id", user.id)
      .eq("is_valid", true)
      .then(({ data }) => {
        setCompletedCount(new Set((data ?? []).map((r) => r.route_id)).size);
      });
  }, [user]);

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("idle");
      },
      () => setGeoStatus("denied"),
    );
  }

  const routesWithDistance = useMemo(() => {
    if (!coords) return routes.map((r) => ({ ...r, distanceFromMe: null as number | null }));
    return routes
      .map((r) => {
        const first = r.path_coordinates?.[0];
        const distanceFromMe = first
          ? distanceMeters(coords.lat, coords.lng, first.lat, first.lng) / 1000
          : null;
        return { ...r, distanceFromMe };
      })
      .sort((a, b) => (a.distanceFromMe ?? Infinity) - (b.distanceFromMe ?? Infinity));
  }, [routes, coords]);

  const filteredRoutes =
    activeTag === "전체" ? routesWithDistance : routesWithDistance.filter((r) => r.category_tag === activeTag);

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white shadow-sm">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-100 bg-white/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">🚶 WalkinSpot</h1>
          {user ? (
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
              {user.user_metadata?.nickname ?? user.email ?? "내 계정"}
            </span>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              로그인
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-neutral-500">내 주변 숨은 산책·러닝 코스를 걸어보세요</p>
      </header>

      {/* Challenge / Login banner */}
      {user ? (
        <section className="mx-5 mt-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-4 text-white shadow-sm">
          <p className="text-xs font-medium opacity-80">동네 챌린지 진행 중</p>
          <p className="mt-1 text-base font-bold">
            코스 {completedCount}/{routes.length} 완주 · 카페 쿠폰 받기 🎁
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${routes.length ? Math.min(100, (completedCount / routes.length) * 100) : 0}%` }}
            />
          </div>
        </section>
      ) : (
        <section className="mx-5 mt-4 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-4">
          <p className="text-sm font-bold text-brand-700">회원가입/로그인하고 쿠폰 받기</p>
          <p className="mt-1 text-xs text-brand-600">미션 3가지 성공하면 동네 카페 쿠폰을 선물로 드려요 🎁</p>
          <button
            onClick={() => setShowLogin(true)}
            className="mt-3 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600"
          >
            회원가입 / 로그인
          </button>
        </section>
      )}

      {/* Category tags */}
      <section className="mt-5 px-5">
        <p className="mb-2 text-xs font-semibold text-neutral-400">인기 태그</p>
        <div className="flex flex-wrap gap-2">
          {categoryTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                activeTag === tag
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-300"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      {/* Route list */}
      <section className="mt-5 px-5 pb-10">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-xs font-semibold text-neutral-400">내 주변 산책 코스</p>
          {coords ? (
            <p className="text-xs text-neutral-400">{filteredRoutes.length}개 코스 · 가까운 순</p>
          ) : (
            <button
              onClick={requestLocation}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              {geoStatus === "loading" ? "위치 확인 중..." : geoStatus === "denied" ? "위치 접근 거부됨" : "📍 내 위치 사용"}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {filteredRoutes.map((route) => (
            <Link
              key={route.id}
              href={`/routes/${route.id}`}
              className="block rounded-2xl border border-neutral-100 p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-neutral-900">{route.title}</h2>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    difficultyStyle[route.difficulty] ?? "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {route.difficulty}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{route.description}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
                <span>📏 {route.distance}km</span>
                <span>⏱️ {route.estimated_time}분</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600">
                  #{route.category_tag}
                </span>
                {route.distanceFromMe !== null && (
                  <span className="ml-auto font-medium text-brand-600">
                    내 위치에서 {route.distanceFromMe.toFixed(1)}km
                  </span>
                )}
              </div>
            </Link>
          ))}

          {filteredRoutes.length === 0 && (
            <p className="py-10 text-center text-sm text-neutral-400">
              해당 태그의 코스가 아직 없어요.
            </p>
          )}
        </div>
      </section>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
