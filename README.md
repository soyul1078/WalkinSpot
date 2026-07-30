# 🚶 WalkinSpot (워킹스팟)

**동네 주민들이 숨은 산책·러닝 코스를 공유하고, 함께 걸으며 스탬프를 모아 동네 쿠폰을 받는 GPS 기반 챌린지 앱**

## 📌 프로젝트 개요

### 핵심 기능
- **코스 탐색 & 등록**: 사용자가 직접 발견한 산책로를 공유 (카테고리: 벚꽃/계절, 강변, 야경, 러닝, 반려견 동반 등)
- **게이미피케이션**: GPS 기반 체크포인트 스탐프 수집, 안개 해제 (Fog of War) 맵 기능
- **리워드 시스템**: 코스 완주 시 지역 제휴 카페/매장의 할인 쿠폰 지급

### 타겟 사용자
- 동네에서 가볍게 산책하거나 러닝을 즐기는 사람
- 반려견과 새로운 산책로를 찾는 보호자
- 걷기 운동 중 소소한 혜택(쿠폰, 배지)을 받고 싶은 사람

## 📁 프로젝트 구조

```
WalkinSpot/
├── app/, lib/         # 웹 MVP (Next.js) — Vercel에 루트 그대로 배포
├── backend/           # 백엔드 API (Supabase Edge Functions)
├── database/          # DB 스키마, RLS 정책, 시드 데이터
├── docs/              # 문서
└── README.md
```

모바일 앱(Flutter/FlutterFlow)은 추후 별도 트랙으로 진행 예정이며, 지금은 Vercel에
바로 배포해 확인할 수 있는 Next.js 웹 MVP로 홈 화면부터 구현 중입니다. 웹 앱 소스가
저장소 루트에 있는 이유는 Vercel이 별도 설정 없이(zero-config) 바로 빌드하게 하기
위함입니다.

## 🗄️ 데이터베이스 모델

### 핵심 테이블
1. **users**: 유저 정보
2. **routes**: 산책 코스
3. **checkpoints**: 스탬프 지점
4. **stamps_logs**: 완주 기록 및 스탬프 획득 로그
5. **coupons**: 쿠폰
6. **partner_stores**: 제휴 매장

## 🚀 시작하기

### 필수 환경
- Node.js 18+
- Supabase CLI (Edge Functions 배포 시)
- Flutter SDK (추후 모바일 앱 개발 시)

### 웹 MVP 로컬 실행
```bash
npm install
npm run dev   # http://localhost:3000
```

### 환경 설정
```bash
cp .env.example .env.local
# .env.local에 Supabase 정보 입력 (NEXT_PUBLIC_ 변수는 웹 앱에서 사용)
```

### 데이터베이스 초기화
```bash
# Supabase 프로젝트에 직접 SQL 실행
# database/schema.sql 참고
```

## 📱 화면 구조

1. **홈 (탐색)**: 내 주변 산책 코스 지도/리스트
2. **코스 상세**: 경로, 체크포인트, 후기
3. **산책 모드**: 실시간 GPS 트래킹 및 스탬프
4. **내 쿠폰함 & 마이**: 획득한 쿠폰, 배지, 탐험 완주율

## 🔐 보안 & 어뷰징 방지

- GPS 속도 검증: 시속 15km 초과 시 적립 무효 처리
- 체크포인트 중복 검증: 일정 시간 간격 필요

## 📝 라이센스

TBD

## 👨‍💻 개발자

- soyul1078
