"use client";

// ============================================================================
// 管理画面で 何かが 投げた とき、★それを 見えるように します
//
//   ★出どころ [ACTION] Opus → Code（★2026-09-15）
//     「★add a temporary console/error log, or read the Vercel function
//       logs for the /admin request。★do not guess further」
//
//   ★★なぜ これを 置くか。
//     ★★坂本さんが `/admin` で 404 を ご覧に なって います。
//     ★★私は ログインした 状態を 作れません。★見えるのは ここまで ──
//       ★`/admin` は 本番で **307**（★ログインへ 送る）を 返します。
//       ★★つまり 道は 在ります。★404 では ありません。
//     ★★だから「投げて いるのか、★そうでは ないのか」が 分かりません。
//
//   ★★★この1枚は、★その 問いに 答えます。
//     ★★これが 出る … ★どこかが 投げて います。★文が 出ます。
//     ★★これが 出ず、★まだ 404 … ★投げて いません。
//       ★★配りの 道の 話です（★入れた PWA／Service Worker／別の 行き先）。
//
//   ★★`app/admin/` の 下だけ に かかります。★ほかの 画面は 変わりません。
//   ★★中身を 出しますが、★ここは `is_admin` の 門の 内側 です。
//     ★★門を 通る 前に 投げた ときは、★文だけが 出ます。
//       ★記録は 1つも 出ません（★この1枚は 台帳を 引きません）。
// ============================================================================

import { useEffect } from "react";

export default function AdminError({ error, reset }) {
  useEffect(() => {
    // ★★Vercel の 記録にも 残します。★画面を 閉じても 追えるように。
    console.error("★管理画面で 投げました:", error);
  }, [error]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ fontSize: "1.4rem", marginBottom: 16 }}>
        管理画面を 出せませんでした
      </h1>
      <p style={{ fontSize: "0.875rem", lineHeight: 1.9, marginBottom: 16 }}>
        ★404 では ありません。★何かが 途中で 止まりました。
        <br />
        下の 文を、★そのまま お知らせください。
      </p>
      <pre style={{
        fontSize: "0.8125rem", lineHeight: 1.7, padding: 12,
        borderRadius: 8, overflowX: "auto", whiteSpace: "pre-wrap",
        background: "#F6F1E7", border: "1px solid #E4DCC9"
      }}>
        {String((error && error.message) || error || "（文が ありません）")}
        {error && error.digest ? "\n\ndigest: " + error.digest : ""}
      </pre>
      <button type="button" onClick={() => reset()}
        style={{
          marginTop: 16, padding: "10px 18px", borderRadius: 999,
          border: "1px solid #E4DCC9", background: "#FFFDF8",
          fontSize: "0.875rem", minHeight: 44
        }}>
        もう一度 試す
      </button>
    </main>
  );
}
