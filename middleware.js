import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  // トークンが期限切れなら更新する
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // ★このミドルウェアは、対象になった全リクエストで supabase.auth.getUser() を await する。
  //   つまり Supabase が遅い・落ちているとき、対象のURLは全て道連れで 504 になる。
  //   認証セッションの更新が不要な公開アセット（manifest・Service Worker・アイコン・
  //   robots/sitemap）を除外して、巻き込まれる範囲を狭めている。
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\\.js|icons/|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
