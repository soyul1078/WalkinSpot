const EARTH_RADIUS_METERS = 6371000;

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

// 카테고리별 대략적인 운동 강도(MET). 정확한 개인 체중 정보가 없어
// 평균 체중(65kg) 기준으로 예상치를 계산한다.
const MET_BY_CATEGORY: Record<string, number> = {
  러닝: 9.8,
  반려견: 3.3,
  완만: 3.5,
};
const DEFAULT_MET = 4.0;
const ASSUMED_WEIGHT_KG = 65;

export function estimateCalories(categoryTag: string, estimatedTimeMinutes: number): number {
  const met = MET_BY_CATEGORY[categoryTag] ?? DEFAULT_MET;
  const hours = estimatedTimeMinutes / 60;
  return Math.round(met * ASSUMED_WEIGHT_KG * hours);
}
