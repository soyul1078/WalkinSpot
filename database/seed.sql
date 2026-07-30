-- WalkinSpot MVP Seed Data
-- Supabase SQL Editor에서 schema.sql 실행 후 이어서 실행하세요.
-- (SQL Editor는 postgres 역할로 실행되어 RLS 정책의 영향을 받지 않습니다)
--
-- 참고: docs/DEVELOPMENT.md의 "MVP 테스트 데이터 준비" 섹션 기준
-- - 코스 3개 (영등포 공원 아침 산책 / 한강 강변 러닝 코스 / 반려견과 함께하는 산책)
-- - 제휴점 2곳 (스타벅스 영등포점 / 로컬 카페 X)

WITH seed_user AS (
  INSERT INTO users (nickname)
  VALUES ('walkinspot_official')
  RETURNING id
),

-- ── 제휴 매장 ─────────────────────────────────────────────
partner_starbucks AS (
  INSERT INTO partner_stores (name, description, latitude, longitude, category)
  VALUES ('스타벅스 영등포점', '영등포공원 인근 스타벅스 매장', 37.5210, 126.9080, '카페')
  RETURNING id
),
partner_local_cafe AS (
  INSERT INTO partner_stores (name, description, latitude, longitude, category)
  VALUES ('로컬 카페 X', '한강공원 근처 개인 로컬 카페', 37.5285, 126.9330, '카페')
  RETURNING id
),

-- ── 코스 1: 영등포 공원 아침 산책 ─────────────────────────
route1 AS (
  INSERT INTO routes (creator_id, title, description, category_tag, distance, estimated_time, difficulty, path_coordinates, is_public)
  SELECT id,
    '영등포 공원 아침 산책',
    '영등포공원을 한 바퀴 도는 평탄한 아침 산책 코스입니다.',
    '완만', 2.5, 35, '쉬움',
    '[{"lat":37.5215,"lng":126.9090},{"lat":37.5218,"lng":126.9105},{"lat":37.5225,"lng":126.9098},{"lat":37.5215,"lng":126.9090}]'::jsonb,
    true
  FROM seed_user
  RETURNING id
),
route1_checkpoints AS (
  INSERT INTO checkpoints (route_id, name, latitude, longitude, order_index, radius_meters)
  SELECT route1.id, v.name, v.lat, v.lng, v.order_index, 50
  FROM route1, (VALUES
    ('공원 정문', 37.5215::decimal, 126.9090::decimal, 1),
    ('중앙 분수대', 37.5218::decimal, 126.9105::decimal, 2),
    ('산책로 전망대', 37.5225::decimal, 126.9098::decimal, 3)
  ) AS v(name, lat, lng, order_index)
  RETURNING id
),

-- ── 코스 2: 한강 강변 러닝 코스 ────────────────────────────
route2 AS (
  INSERT INTO routes (creator_id, title, description, category_tag, distance, estimated_time, difficulty, path_coordinates, is_public)
  SELECT id,
    '한강 강변 러닝 코스',
    '여의도 한강공원을 따라 달리는 강변 러닝 코스입니다.',
    '러닝', 5.0, 50, '보통',
    '[{"lat":37.5280,"lng":126.9320},{"lat":37.5290,"lng":126.9345},{"lat":37.5300,"lng":126.9365},{"lat":37.5285,"lng":126.9330}]'::jsonb,
    true
  FROM seed_user
  RETURNING id
),
route2_checkpoints AS (
  INSERT INTO checkpoints (route_id, name, latitude, longitude, order_index, radius_meters)
  SELECT route2.id, v.name, v.lat, v.lng, v.order_index, 50
  FROM route2, (VALUES
    ('여의도 한강공원 입구', 37.5280::decimal, 126.9320::decimal, 1),
    ('물빛광장', 37.5290::decimal, 126.9345::decimal, 2),
    ('마포대교 남단', 37.5300::decimal, 126.9365::decimal, 3),
    ('반환점 카페거리', 37.5285::decimal, 126.9330::decimal, 4)
  ) AS v(name, lat, lng, order_index)
  RETURNING id
),

-- ── 코스 3: 반려견과 함께하는 산책 ─────────────────────────
route3 AS (
  INSERT INTO routes (creator_id, title, description, category_tag, distance, estimated_time, difficulty, path_coordinates, is_public)
  SELECT id,
    '반려견과 함께하는 산책',
    '반려견 동반이 가능한 완만한 경사의 짧은 산책 코스입니다.',
    '반려견', 1.5, 20, '쉬움',
    '[{"lat":37.5230,"lng":126.9070},{"lat":37.5238,"lng":126.9080},{"lat":37.5230,"lng":126.9070}]'::jsonb,
    true
  FROM seed_user
  RETURNING id
),
route3_checkpoints AS (
  INSERT INTO checkpoints (route_id, name, latitude, longitude, order_index, radius_meters)
  SELECT route3.id, v.name, v.lat, v.lng, v.order_index, 50
  FROM route3, (VALUES
    ('반려견 놀이터 입구', 37.5230::decimal, 126.9070::decimal, 1),
    ('산책로 쉼터', 37.5238::decimal, 126.9080::decimal, 2)
  ) AS v(name, lat, lng, order_index)
  RETURNING id
),

-- ── 쿠폰 ───────────────────────────────────────────────────
coupon1 AS (
  INSERT INTO coupons (route_id, partner_store_id, discount_detail, coupon_code)
  SELECT route1.id, partner_starbucks.id, '아메리카노(Tall) 10% 할인', 'WS-ROUTE1-STARBUCKS'
  FROM route1, partner_starbucks
  RETURNING id
),
coupon2 AS (
  INSERT INTO coupons (route_id, partner_store_id, discount_detail, coupon_code)
  SELECT route2.id, partner_local_cafe.id, '아이스 아메리카노 1잔 무료', 'WS-ROUTE2-LOCALCAFE'
  FROM route2, partner_local_cafe
  RETURNING id
),
coupon3 AS (
  INSERT INTO coupons (route_id, partner_store_id, discount_detail, coupon_code)
  SELECT route3.id, partner_starbucks.id, '디저트 메뉴 15% 할인', 'WS-ROUTE3-STARBUCKS'
  FROM route3, partner_starbucks
  RETURNING id
)

SELECT 'Seed data inserted successfully' AS status;
