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
