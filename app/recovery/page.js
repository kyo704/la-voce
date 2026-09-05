"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import {
  normalizeRecoveryCode, isWellFormedRecoveryCode, RECOVERY_PREFIX
} from "@/lib/recoveryCode";

// ============================================================================
// メールが使えなくなった方へ（2026-09-05）
//
//   出どころ docs/reports/2026-09-05-復旧コードの使い方-設計.md §2（承認済み）
//            docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §2・§3
//
//   ★★ログインしていない方が来ます。★ここで、入る道を作り直します。
//
//   ★聞くのは3つです。
//     ・いままでのアドレス   ★「受け取れない」のであって「忘れた」ではありません
//     ・控えの番号
//     ・これから使うアドレス
//
//   ★★問い合わせの窓口は、作りません（判断書 §2）。
//     ★「本人です」と名乗り出た方が本人かどうか、★こちらには確かめられません。
//     ★★そして9か月、答える人が国外にいます。
//
//   ★合っても合わなくても、★同じ答えを出します。
//     ★★「そのアドレスは登録されていません」と言わないこと。
//     ★言うと、★誰が使っているかを調べる道具になります。
// ============================================================================

export default function RecoveryPage() {
  const [oldEmail, setOldEmail] = useState("");
  const [code, setCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const ready = oldEmail.trim() && newEmail.trim() && isWellFormedRecoveryCode(code);

  async function submit(e) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/recovery/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ oldEmail, code, newEmail })
      });
      const data = await res.json().catch(() => ({}));
      setBusy(false);
      if (!res.ok) {
        setError(data.error || "いま、お手続きできません。少し置いて、もう一度お試しください。");
        return;
      }
      setDone(true);
    } catch (e2) {
      setBusy(false);
      console.error("★送れませんでした:", e2 && e2.message);
      setError("いま、お手続きできません。少し置いて、もう一度お試しください。");
    }
  }

  const input = {
    width: "100%", padding: "14px", borderRadius: 12,
    border: `1px solid ${C.line}`, background: C.card, color: C.ink,
    // ★16px を下回らないこと。★iOS が画面を勝手に拡大します。
    fontSize: "max(16px, 1rem)", marginBottom: 16, boxSizing: "border-box"
  };
  const label = { fontSize: "1rem", color: C.ink, margin: "0 0 6px", lineHeight: 1.7 };

  // ★★合っても合っていなくても、★同じ画面を出します。
  //   ★「送りました」とは書きません。★送れたかどうかを、こちらは言えません。
  if (done) {
    return (
      <main style={{ maxWidth: 420, margin: "0 auto", padding: "56px 24px 96px", color: C.ink }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 14px", lineHeight: 1.5 }}>
          お手続きを受け付けました。
        </h1>
        <p style={{ fontSize: "1rem", margin: "0 0 10px", lineHeight: 1.9 }}>
          控えの番号が合っていれば、新しいアドレスに番号が届きます。
        </p>
        <p style={{ fontSize: "1rem", margin: "0 0 10px", lineHeight: 1.9 }}>
          届いたら、ログインの画面から、その番号でお入りください。
        </p>
        <p style={{ fontSize: "0.9375rem", color: C.inkSoft, margin: "0 0 24px", lineHeight: 1.9 }}>
          届かないときは、迷惑メールもご覧ください。
        </p>
        <a href="/login"
          style={{
            display: "block", width: "100%", padding: "15px", borderRadius: 999,
            background: C.curtain, color: "#FFFDF8", fontSize: "1.0625rem", fontWeight: 600,
            textAlign: "center", textDecoration: "none", boxSizing: "border-box"
          }}>
          ログインの画面へ
        </a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "56px 24px 96px", color: C.ink }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 12px", lineHeight: 1.5 }}>
        メールが使えなくなった方へ
      </h1>
      <p style={{ fontSize: "1rem", margin: "0 0 8px", lineHeight: 1.9 }}>
        ご登録のときにお渡しした、控えの番号をお使いください。
      </p>
      <p style={{ fontSize: "1rem", margin: "0 0 24px", lineHeight: 1.9 }}>
        新しいアドレスに付け替えて、そちらから入れるようにします。
      </p>

      {/* ★★本物の form にします。★端末が、アドレスを差し出してくれます。 */}
      <form onSubmit={submit}>
        <p style={label}>いままでのメールアドレス</p>
        <input type="email" name="email" autoComplete="email" inputMode="email"
          value={oldEmail} onChange={(e) => setOldEmail(e.target.value)}
          placeholder="mail@example.com" style={input} />

        <p style={label}>控えの番号</p>
        <input type="text" name="recovery-code" autoComplete="off"
          value={code} onChange={(e) => setCode(e.target.value)}
          placeholder={`${RECOVERY_PREFIX}-0000-0000-0000`}
          aria-label="控えの番号"
          style={{ ...input, fontFamily: "var(--font-mono), monospace", letterSpacing: "0.06em" }} />
        {/* ★書き写した形のまま入れていただけます。
            ★小文字も、全角も、区切りの有無も、こちらで直します。 */}
        <p style={{ fontSize: "0.9375rem", color: C.inkSoft, margin: "-8px 0 16px", lineHeight: 1.8 }}>
          書き写したとおりに入れてください。大文字・小文字は問いません。
        </p>

        <p style={label}>これから使うメールアドレス</p>
        <input type="email" name="new-email" autoComplete="email" inputMode="email"
          value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
          placeholder="mail@example.com" style={input} />

        {error && (
          <p style={{ fontSize: "0.9375rem", color: C.curtain, margin: "0 0 12px", lineHeight: 1.7 }}>{error}</p>
        )}

        <button type="submit" disabled={!ready || busy}
          style={{
            width: "100%", padding: "15px", borderRadius: 999, border: "none",
            background: C.curtain, color: "#FFFDF8", fontSize: "1.0625rem", fontWeight: 600,
            minHeight: 52, opacity: (!ready || busy) ? 0.5 : 1
          }}>
          {busy ? "お手続きしています…" : "付け替える"}
        </button>
      </form>

      {/* ★★正直に書きます。★あとで「何とかしてください」が来ないように。
          ★そのとき、★何ともできません。 */}
      <div style={{ background: C.paper, borderRadius: 14, padding: 14, margin: "24px 0 18px" }}>
        <p style={{ fontSize: "0.9375rem", margin: "0 0 6px", lineHeight: 1.9 }}>
          控えの番号を無くしてしまった場合、私たちの側で元に戻すことはできません。
        </p>
        <p style={{ fontSize: "0.9375rem", margin: 0, lineHeight: 1.9 }}>
          記録は残っていますが、取り出す手立てがありません。
        </p>
      </div>

      {/* ★どの画面にも、戻る先があります。 */}
      <a href="/login" style={{ fontSize: "1rem", color: C.inkSoft, display: "inline-block", padding: "12px 8px" }}>
        ログインの画面へ戻る
      </a>
    </main>
  );
}
