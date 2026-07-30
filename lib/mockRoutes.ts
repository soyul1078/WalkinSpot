export type Route = {
  id: string;
  title: string;
  description: string;
  category_tag: string;
  distance: number;
  estimated_time: number;
  difficulty: string;
};

// database/seed.sql 의 MVP 샘플 코스와 동일한 데이터.
// Supabase 연동 전이거나 요청이 실패할 때 화면이 비지 않도록 하는 기본값.
export const mockRoutes: Route[] = [
  {
    id: "r1",
    title: "영등포 공원 아침 산책",
    description: "영등포공원을 한 바퀴 도는 평탄한 아침 산책 코스입니다.",
    category_tag: "완만",
    distance: 2.5,
    estimated_time: 35,
    difficulty: "쉬움",
  },
  {
    id: "r2",
    title: "한강 강변 러닝 코스",
    description: "여의도 한강공원을 따라 달리는 강변 러닝 코스입니다.",
    category_tag: "러닝",
    distance: 5.0,
    estimated_time: 50,
    difficulty: "보통",
  },
  {
    id: "r3",
    title: "반려견과 함께하는 산책",
    description: "반려견 동반이 가능한 완만한 경사의 짧은 산책 코스입니다.",
    category_tag: "반려견",
    distance: 1.5,
    estimated_time: 20,
    difficulty: "쉬움",
  },
];

export const categoryTags = ["전체", "완만", "러닝", "반려견", "강변", "야경", "벚꽃"];
