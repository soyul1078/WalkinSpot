# Frontend - WalkinSpot 웹 MVP

## 기술 스택
- **Framework**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Data**: Supabase JS client (env 미설정 시 샘플 데이터로 자동 대체)

Flutter/FlutterFlow 기반 모바일 앱은 추후 별도로 진행 예정이며, 지금은 Vercel에 바로
배포해 확인할 수 있는 웹 버전으로 홈 화면 MVP를 먼저 구현했습니다.

## 폴더 구조
```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx        # 홈 화면 (코스 리스트, 태그 필터, 챌린지 배너)
│   └── globals.css
├── lib/
│   ├── supabaseClient.ts   # env 있으면 실사용, 없으면 null
│   └── mockRoutes.ts       # database/seed.sql과 동일한 샘플 코스 3개
├── package.json
└── tailwind.config.ts
```

## 로컬 실행
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

## Supabase 연동 (선택)
`frontend/.env.local` 생성 후 아래 값을 채우면 목 데이터 대신 실제 `routes` 테이블을 조회합니다.
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Vercel 배포
1. GitHub 저장소를 Vercel에 Import
2. **Root Directory를 `frontend`로 설정** (모노레포 구조라 필수)
3. (선택) 위 Supabase 환경변수를 Vercel 프로젝트 설정에 추가
4. Framework Preset은 Next.js가 자동 감지됨 → Deploy

## 주요 화면 (구현 상태)
1. **Home** ✅ — 코스 리스트, 인기 태그 필터, 진행 중인 챌린지 배너
2. **Course Detail** ⏳
3. **Walk Mode** ⏳
4. **My Coupons** ⏳
