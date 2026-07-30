"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { categoryTags, mockRoutes, type Route } from "@/lib/mockRoutes";

const difficultyStyle: Record<string, string> = {
  쉬움: "bg-brand-100 text-brand-700",
  보통: "bg-amber-100 text-amber-700",
  어려움: "bg-rose-100 text-rose-700",
};

export default function Home() {
  const [routes, setRoutes] = useState<Route[]>(mockRoutes);
  const [activeTag, setActiveTag] = useState("전체");
  const [usingLiveData, setUsingLiveData] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase
      .from("routes")
      .select("id, title, description, category_tag, distance, estimated_time, difficulty")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setRoutes(data as Route[]);
          setUsingLiveData(true);
        }
      });
  }, []);

  const filteredRoutes =
    activeTag === "전체" ? routes : routes.filter((r) => r.category_tag === activeTag);

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white shadow-sm">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-100 bg-white/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">🚶 WalkinSpot</h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              usingLiveData ? "bg-brand-100 text-brand-700" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {usingLiveData ? "실시간 데이터" : "샘플 데이터"}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-500">내 주변 숨은 산책·러닝 코스를 걸어보세요</p>
      </header>

      {/* Challenge banner */}
      <section className="mx-5 mt-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-4 text-white shadow-sm">
        <p className="text-xs font-medium opacity-80">진행 중인 동네 챌린지</p>
        <p className="mt-1 text-base font-bold">코스 3개 완주하고 카페 쿠폰 받기 🎁</p>
        <p className="mt-1 text-xs opacity-90">체크포인트에 도착하면 자동으로 스탬프가 찍혀요</p>
      </section>

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
          <p className="text-xs text-neutral-400">{filteredRoutes.length}개 코스</p>
        </div>

        <div className="flex flex-col gap-3">
          {filteredRoutes.map((route) => (
            <article
              key={route.id}
              className="rounded-2xl border border-neutral-100 p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
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
              </div>
            </article>
          ))}

          {filteredRoutes.length === 0 && (
            <p className="py-10 text-center text-sm text-neutral-400">
              해당 태그의 코스가 아직 없어요.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
