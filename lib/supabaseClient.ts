import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경변수가 설정되지 않은 경우(로컬/미리보기 배포) null을 반환해
// 페이지가 목 데이터로 정상적으로 렌더링되도록 한다.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
