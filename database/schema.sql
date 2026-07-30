-- WalkinSpot Database Schema
-- Supabase PostgreSQL

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nickname VARCHAR(50) NOT NULL UNIQUE,
  profile_img_url TEXT,
  total_distance DECIMAL(10, 2) DEFAULT 0,
  total_stamps INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Routes Table (산책 코스)
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category_tag VARCHAR(50), -- '벚꽃', '강변', '야경', '러닝', '반려견', '완만' 등
  distance DECIMAL(10, 2) NOT NULL, -- km
  estimated_time INT, -- 분 (minutes)
  difficulty VARCHAR(20), -- '쉬움', '보통', '어려움'
  path_coordinates JSONB, -- GPS 경로 데이터 [{lat, lng}, ...]
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Checkpoints Table (스탐프 지점)
CREATE TABLE IF NOT EXISTS checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  name VARCHAR(100),
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  order_index INT NOT NULL, -- 코스 내 순서
  radius_meters INT DEFAULT 50, -- GPS 허용 반경
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Stamps/Logs Table (완주 기록 및 스탬프)
CREATE TABLE IF NOT EXISTS stamps_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  checkpoint_id UUID REFERENCES checkpoints(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE, -- 어뷰징 여부
  invalid_reason VARCHAR(100), -- 어뷰징 사유 (speed_exceeded 등)
  average_speed DECIMAL(5, 2), -- km/h
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Partner Stores Table (제휴 매장)
CREATE TABLE IF NOT EXISTS partner_stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  category VARCHAR(50), -- '카페', '음식점', '편의점' 등
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Coupons Table (쿠폰)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  partner_store_id UUID NOT NULL REFERENCES partner_stores(id) ON DELETE CASCADE,
  discount_detail VARCHAR(200) NOT NULL, -- '5000원 이상 20% 할인' 등
  coupon_code VARCHAR(100) UNIQUE,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. User Coupons Table (사용자가 보유한 쿠폰)
CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, coupon_id)
);

-- 8. Route Reviews Table (코스 후기)
CREATE TABLE IF NOT EXISTS route_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  image_urls JSONB, -- 사용자가 촬영한 사진들
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Badges Table (배지)
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. User Badges Table (사용자 배지 획득)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);

-- Indexes for Performance
CREATE INDEX idx_routes_creator ON routes(creator_id);
CREATE INDEX idx_routes_category ON routes(category_tag);
CREATE INDEX idx_checkpoints_route ON checkpoints(route_id);
CREATE INDEX idx_stamps_logs_user ON stamps_logs(user_id);
CREATE INDEX idx_stamps_logs_route ON stamps_logs(route_id);
CREATE INDEX idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX idx_coupons_route ON coupons(route_id);
CREATE INDEX idx_route_reviews_route ON route_reviews(route_id);

-- ============================================================
-- Auth Trigger: auth.users에 가입 시 public.users 프로필 자동 생성
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', 'user_' || substr(NEW.id::text, 1, 8)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Users: 프로필은 전체 공개 조회, 본인만 수정 가능
CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Routes: 공개 코스는 전체 조회, 비공개는 작성자만. 생성/수정/삭제는 작성자만
CREATE POLICY "routes_select_public_or_own" ON routes FOR SELECT USING (is_public = true OR auth.uid() = creator_id);
CREATE POLICY "routes_insert_own" ON routes FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "routes_update_own" ON routes FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "routes_delete_own" ON routes FOR DELETE USING (auth.uid() = creator_id);

-- Checkpoints: 전체 조회, 해당 코스의 작성자만 등록/수정/삭제
CREATE POLICY "checkpoints_select_all" ON checkpoints FOR SELECT USING (true);
CREATE POLICY "checkpoints_insert_route_owner" ON checkpoints FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM routes WHERE routes.id = checkpoints.route_id AND routes.creator_id = auth.uid())
);
CREATE POLICY "checkpoints_update_route_owner" ON checkpoints FOR UPDATE USING (
  EXISTS (SELECT 1 FROM routes WHERE routes.id = checkpoints.route_id AND routes.creator_id = auth.uid())
);
CREATE POLICY "checkpoints_delete_route_owner" ON checkpoints FOR DELETE USING (
  EXISTS (SELECT 1 FROM routes WHERE routes.id = checkpoints.route_id AND routes.creator_id = auth.uid())
);

-- Stamps/Logs: 본인 기록만 조회/생성 가능 (수정·삭제 불가 = 위변조 방지)
CREATE POLICY "stamps_logs_select_own" ON stamps_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stamps_logs_insert_own" ON stamps_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Partner Stores / Coupons / Badges: 전체 조회만 허용 (등록·수정은 service_role 전용)
CREATE POLICY "partner_stores_select_all" ON partner_stores FOR SELECT USING (true);
CREATE POLICY "coupons_select_all" ON coupons FOR SELECT USING (true);
CREATE POLICY "badges_select_all" ON badges FOR SELECT USING (true);

-- User Coupons: 본인 보유 쿠폰만 조회/획득/사용 처리 가능
CREATE POLICY "user_coupons_select_own" ON user_coupons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_coupons_insert_own" ON user_coupons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_coupons_update_own" ON user_coupons FOR UPDATE USING (auth.uid() = user_id);

-- User Badges: 본인 배지만 조회 가능 (지급은 service_role 전용)
CREATE POLICY "user_badges_select_own" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- Route Reviews: 전체 공개 조회, 본인 후기만 작성/수정/삭제
CREATE POLICY "route_reviews_select_all" ON route_reviews FOR SELECT USING (true);
CREATE POLICY "route_reviews_insert_own" ON route_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "route_reviews_update_own" ON route_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "route_reviews_delete_own" ON route_reviews FOR DELETE USING (auth.uid() = user_id);
