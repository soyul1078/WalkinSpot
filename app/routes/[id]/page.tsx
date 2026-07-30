"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getMockRouteById, type Checkpoint, type LatLng, type Route } from "@/lib/mockRoutes";
import { estimateCalories } from "@/lib/geo";

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

type RouteDetail = Route;

export default function RouteDetailPage() {
  const params = useParams<{ id: string }>();
  const routeId = params.id;

  const [route, setRoute] = useState<RouteDetail | null>(getMockRouteById(routeId) ?? null);
  const [loading, setLoading] = useState(!route);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      if (!route) setNotFound(true);
      return;
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

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
    <main className="mx-auto min-h-screen max-w-lg bg-white pb-10 shadow-sm">
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
          <div className="rounded-2xl bg-neutral-50 p-3 text-center">
            <p className="text-lg font-bold text-neutral-900">{route.distance}km</p>
            <p className="mt-0.5 text-xs text-neutral-500">거리</p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-3 text-center">
            <p className="text-lg font-bold text-neutral-900">{route.estimated_time}분</p>
            <p className="mt-0.5 text-xs text-neutral-500">예상 소요</p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-3 text-center">
            <p className="text-lg font-bold text-neutral-900">{calories}kcal</p>
            <p className="mt-0.5 text-xs text-neutral-500">예상 소모</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-neutral-400">
          * 칼로리는 평균 체중(65kg) 기준 예상치예요. 로그인 후 프로필에 체중을 입력하면 더 정확해져요.
        </p>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold text-neutral-400">체크포인트 ({route.checkpoints.length})</p>
          <ol className="flex flex-col gap-2">
            {route.checkpoints.map((cp, i) => (
              <li key={cp.name} className="flex items-center gap-3 rounded-xl border border-neutral-100 px-3 py-2 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {i + 1}
                </span>
                {cp.name}
              </li>
            ))}
          </ol>
        </div>

        <button className="mt-6 w-full rounded-2xl bg-brand-500 py-3 text-sm font-bold text-white transition hover:bg-brand-600">
          이 코스로 산책 시작하기
        </button>
      </section>
    </main>
  );
}
