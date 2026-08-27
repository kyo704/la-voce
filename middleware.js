import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { withTimeout, MIDDLEWARE_TIMEOUT_MS } from "@/lib/withTimeout";

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

  // トークンが期限切れなら更新する。
  // ★時間制限を付けること。ここはほぼ全リクエストが通る場所で、
  //   以前は制限が無かった。Supabase が応答しないと、この await が返らず、
  //   サイト全体が「読み込み中のまま止まる」状態になっていた。
  //   時間切れのときは、セッションを更新せずに先へ進める。今回のリクエストで
  //   トークンが新しくならないだけで、ログアウトはしない。
  try {
    await withTimeout(supabase.auth.getUser(), MIDDLEWARE_TIMEOUT_MS, "ミドルウェアの認証確認");
  } catch (e) {
    console.warn("ミドルウェアでの認証確認を打ち切りました。セッションの更新は次回に持ち越します。", e.message);
  }

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
