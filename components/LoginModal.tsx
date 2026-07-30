"use client";

import { supabase } from "@/lib/supabaseClient";
import type { Provider } from "@supabase/supabase-js";

type OAuthOption = {
  id: string;
  label: string;
  provider?: Provider;
  className: string;
  note?: string;
};

// Google, Kakao, X(Twitter)는 Supabase Auth가 기본 제공하는 OAuth 프로바이더라 바로 연결된다.
// Naver는 Supabase 기본 프로바이더 목록에 없어서, Supabase 대시보드에 Custom OIDC로
// 별도 등록해야 실제로 동작한다 (Client ID/Secret 발급 후 Authentication > Providers에서 설정).
const OAUTH_OPTIONS: OAuthOption[] = [
  { id: "google", label: "Google로 계속하기", provider: "google", className: "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50" },
  { id: "kakao", label: "카카오로 계속하기", provider: "kakao", className: "bg-[#FEE500] text-neutral-900 hover:brightness-95" },
  { id: "twitter", label: "X로 계속하기", provider: "twitter", className: "bg-black text-white hover:bg-neutral-800" },
  {
    id: "naver",
    label: "네이버로 계속하기",
    className: "bg-[#03C75A] text-white hover:brightness-95",
    note: "Supabase에 Custom OIDC 등록 후 활성화됩니다",
  },
];

export default function LoginModal({ onClose }: { onClose: () => void }) {
  async function handleLogin(option: OAuthOption) {
    if (!supabase) {
      alert("Supabase 환경변수가 설정되지 않아 로그인을 사용할 수 없습니다.");
      return;
    }
    if (!option.provider) {
      alert(`${option.label.replace("로 계속하기", "")} 로그인은 Supabase에 커스텀 OIDC 프로바이더 등록이 필요합니다.`);
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: option.provider,
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">🚶 WalkinSpot 로그인</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600" aria-label="닫기">
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          로그인하면 걸은 코스가 저장되고 스탬프·쿠폰을 받을 수 있어요.
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          {OAUTH_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleLogin(option)}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${option.className}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-neutral-400">
          네이버 로그인은 Supabase 커스텀 OIDC 연동이 필요해 준비 중입니다.
        </p>
      </div>
    </div>
  );
}
