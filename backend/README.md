# Backend - WalkinSpot API

## 기술 스택
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Supabase Realtime / REST API
- **Functions**: Supabase Edge Functions (선택사항)

## 폴더 구조
```
backend/
├── functions/           # Edge Functions (JS/TypeScript)
├── migrations/          # DB 마이그레이션
└── README.md
```

## 주요 API 엔드포인트
- `GET /routes`: 코스 목록
- `POST /routes`: 코스 등록
- `POST /stamps`: 스탐프 획득
- `GET /coupons`: 쿠폰 목록
- `POST /user-coupons`: 쿠폰 획득

## 비즈니스 로직
- GPS 속도 검증 (시속 15km 초과 시 무효)
- 체크포인트 도달 검증 (반경 내 도달 시)
- 스탐프 적립 및 쿠폰 발급

## 배포

각 함수는 Deno 기반 Supabase Edge Function입니다 (`Deno.serve`, `npm:@supabase/supabase-js` 사용).
Supabase CLI는 함수를 `supabase/functions/<name>/index.ts` 경로에서만 찾으므로,
배포 전 `backend/functions`의 내용을 `supabase/functions`로 복사(또는 심볼릭 링크)해야 합니다.

```bash
# 1회성: supabase/functions 로 연결
ln -s ../backend/functions supabase/functions   # Windows는 mklink /D 사용

supabase functions deploy routes --project-ref <project-ref>
supabase functions serve routes --env-file .env.local   # 로컬 테스트
```
