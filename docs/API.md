# WalkinSpot API 문서

## 인증
- Supabase Auth 사용
- JWT 토큰 기반

## Routes (코스)

### 코스 목록 조회
```
GET /routes?category=벚꽃&distance_max=5
```

### 코스 상세 조회
```
GET /routes/{id}
```

### 코스 등록
```
POST /routes
Body: {
  "title": "한강공원 산책로",
  "description": "강변의 아름다운 경치",
  "category_tag": "강변",
  "distance": 3.5,
  "estimated_time": 45,
  "difficulty": "쉬움",
  "path_coordinates": [...],
  "cover_image_url": "..."
}
```

## Checkpoints (스탐프 지점)

### 스탐프 지점 생성
```
POST /routes/{route_id}/checkpoints
Body: {
  "name": "체크포인트 1",
  "latitude": 37.528,
  "longitude": 127.027,
  "order_index": 1
}
```

## Stamps (스탐프 로그)

### 스탐프 획득 (GPS 검증)
```
POST /stamps
Body: {
  "route_id": "uuid",
  "checkpoint_id": "uuid",
  "user_latitude": 37.528,
  "user_longitude": 127.027,
  "average_speed": 4.5
}
Response: {
  "is_valid": true,
  "message": "스탐프를 획득했습니다!"
}
```

## Coupons (쿠폰)

### 쿠폰 목록 조회
```
GET /coupons?route_id=uuid
```

### 쿠폰 획득
```
POST /user-coupons
Body: {
  "coupon_id": "uuid"
}
```

### 쿠폰 사용
```
PATCH /user-coupons/{coupon_id}/use
```

## Users (사용자)

### 사용자 프로필 조회
```
GET /users/{id}
```

### 사용자 통계
```
GET /users/{id}/stats
Response: {
  "total_distance": 15.5,
  "total_stamps": 8,
  "coupons_count": 3,
  "badges": [...]
}
```
