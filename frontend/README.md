# Frontend - WalkinSpot 모바일 앱

## 기술 스택
- **Framework**: Flutter / FlutterFlow
- **State Management**: Provider / Riverpod
- **Maps**: Google Maps / OpenStreetMap
- **GPS**: geolocator, location 패키지

## 폴더 구조
```
frontend/
├── lib/
│   ├── main.dart
│   ├── screens/          # 화면 (Home, CourseDetail, WalkMode, MyCoupons)
│   ├── components/       # 재사용 컴포넌트
│   ├── services/         # Supabase API, GPS 서비스
│   ├── models/           # 데이터 모델
│   └── utils/            # 유틸리티 함수
├── pubspec.yaml
└── README.md
```

## 주요 화면
1. **Home**: 내 주변 코스 지도/리스트
2. **Course Detail**: 코스 상세 정보 & 후기
3. **Walk Mode**: GPS 추적 & 스탐프 획득
4. **My Coupons**: 쿠폰함 & 프로필
