import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WalkinSpot | 워킹스팟",
  description: "동네 주민들이 숨은 산책·러닝 코스를 공유하고, 스탬프를 모아 동네 쿠폰을 받는 GPS 챌린지 앱",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-neutral-50 text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
