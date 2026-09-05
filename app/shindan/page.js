"use client";

import { useEffect, useState } from "react";
// ★★2026-09-05 夜、★「入ったままではないか」を確かめるために足しました。
//   ★推測をやめて、★端末の側で見ます。
import { createClient } from "@/lib/supabase/client";
// ★★時間制限のない getUser() を書かないこと（確かめが見張っています）。
//   ★つながらないときに、★この画面まで固まると、★調べる道具が使えません。
import { getUserWithTimeout } from "@/lib/withTimeout";

// ============================================================================
// 診断の画面（2026-09-05）
//
//   ★★私は、画面を見られません。
//     ★2026-09-05、★同じ直しについて「直った」「直っていない」が
//     ★往復しました。★私の推測が、3回続けて外れました。
//
//   ★★だから、★端末の側で答えが出る画面を作ります。
//     ★推測をやめて、★数字を見ます。
//
//   ★この画面は、★アプリの設定を読みません。★保存もしません。
//     ★★ここで押しても、★お客さまの設定は変わりません。
//     ★見ているのは、★CSS が届いているかどうか、それだけです。
//
//   ★個人のことは、★1つも出しません。★ログインも要りません。
// ============================================================================

export default function ShindanPage() {
  const [ver, setVer] = useState(null);
  const [scale, setScale] = useState("（まだ押していません）");
  const [sizes, setSizes] = useState(null);
  const [rules, setRules] = useState(null);
  // ★いま、入っているかどうか。★入っているなら、誰として入っているか。
  const [who, setWho] = useState("調べています…");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    fetch("/api/version").then((r) => r.json()).then(setVer).catch(() => setVer({ short: "読めません" }));
    read();
    // ★いま html に付いている印を、そのまま見せます。
    setScale(document.documentElement.getAttribute("data-scale") || "（付いていません＝ふつう）");
    checkWho();
  }, []);

  // ★★入っているかどうかを、★そのまま見ます。
  //   ★画面の見た目ではなく、★セッションそのものを見ます。
  async function checkWho() {
    try {
      const { user, unreachable } = await getUserWithTimeout(createClient(), "診断の認証確認");
      // ★★「つながらない」と「入っていない」を、分けます。
      //   ★混ぜると、★入っている方に「出られています」と言ってしまいます。
      if (unreachable) { setWho("★確かめられませんでした（つながりません）"); return; }
      if (!user) { setWho("★入っていません"); return; }
      setWho("★入っています： " + (user.email || "（アドレスなし）"));
    } catch (e) {
      setWho("★確かめられませんでした");
    }
  }

  // ★出てみて、★本当に出られたかを、★その場で見ます。
  async function signOutAndCheck() {
    setSigningOut(true);
    setWho("出ています…");
    try {
      await createClient().auth.signOut();
    } catch (e) {
      // ★失敗しても、★下で見ます。
    }
    // ★★出たあと、★もう一度見ます。★「出たつもり」を、そのままにしないこと。
    await new Promise((r) => setTimeout(r, 400));
    await checkWho();
    setSigningOut(false);
  }

  // ★★CSS の決まりが、★このブラウザに届いているかを数えます。
  //   ★届いていなければ、★0 と出ます。
  function countRules() {
    let calendar = 0;
    let wrap = 0;
    let heading = 0;
    for (const sheet of Array.from(document.styleSheets)) {
      let list;
      try { list = sheet.cssRules; } catch (e) { continue; } // ★別の場所の CSS は読めません
      for (const r of Array.from(list || [])) {
        const t = r.selectorText || "";
        if (/data-scale=?"?xlarge"?\]\s*\.grid-cols-7/.test(t)) calendar += 1;
        if (/data-scale=?"?xlarge"?\]\s*\.justify-between/.test(t)) wrap += 1;
        if (/data-scale=?"?xlarge"?\]\s*h3/.test(t)) heading += 1;
      }
    }
    return { calendar, wrap, heading };
  }

  function read() {
    const cell = document.getElementById("shindan-cell");
    const body = document.getElementById("shindan-body");
    const head = document.getElementById("shindan-head");
    const row = document.getElementById("shindan-row");
    const g = (el) => (el ? window.getComputedStyle(el) : null);
    setSizes({
      root: g(document.documentElement) ? g(document.documentElement).fontSize : "?",
      cell: g(cell) ? g(cell).fontSize : "?",
      body: g(body) ? g(body).fontSize : "?",
      head: g(head) ? g(head).fontSize : "?",
      wrap: g(row) ? g(row).flexWrap : "?",
      // ★★字1つぶんまで潰れていないか。★幅で分かります。
      //   ★1文字より少し広い程度なら、★縦に1文字ずつ並んでいます。
      squeeze: (() => {
        const el = document.getElementById("shindan-squeeze");
        if (!el) return "?";
        const w = Math.round(el.getBoundingClientRect().width);
        const one = parseFloat(g(el).fontSize) || 16;
        return w + "px（1文字は約" + Math.round(one) + "px）" + (w < one * 3 ? " ★潰れています" : " ★大丈夫です");
      })()
    });
    setRules(countRules());
  }

  function apply(v) {
    if (v) document.documentElement.setAttribute("data-scale", v);
    else document.documentElement.removeAttribute("data-scale");
    setScale(v || "（付いていません＝ふつう）");
    // ★描き直しを待ってから測ります。
    setTimeout(read, 60);
  }

  const box = { border: "1px solid #ddd", borderRadius: 12, padding: 14, marginBottom: 14 };
  const btn = {
    flex: 1, padding: "12px", borderRadius: 999, border: "1px solid #ccc",
    background: "#fff", fontSize: "max(16px, 1rem)", minHeight: 48
  };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: 6 }}>診断</h1>
      <p style={{ fontSize: "1rem", lineHeight: 1.8, marginBottom: 18 }}>
        この画面は、文字の大きさの決まりが、この端末に届いているかを見るためのものです。
        アプリの設定は読みませんし、変えません。ログインも要りません。
      </p>

      <div style={box}>
        <p style={{ fontSize: "0.9375rem", margin: 0 }}>
          いま配られている版：<strong>{ver ? (ver.short || "?") : "読んでいます…"}</strong>
        </p>
        <p style={{ fontSize: "0.9375rem", margin: "6px 0 0" }}>
          html に付いている印：<strong>{scale}</strong>
        </p>
      </div>

      {/* ★★入っているかどうか（2026-09-05 夜）。
          ★★「入っているように見える」と「入っている」は、別のことです。
          ★ここは、セッションそのものを見ています。 */}
      <div style={box}>
        <p style={{ fontSize: "1rem", margin: "0 0 10px", lineHeight: 1.8 }}>
          <strong>{who}</strong>
        </p>
        <button type="button" onClick={signOutAndCheck} disabled={signingOut}
          style={{ ...btn, width: "100%", opacity: signingOut ? 0.5 : 1 }}>
          {signingOut ? "出ています…" : "出て、もう一度確かめる"}
        </button>
        <p style={{ fontSize: "0.875rem", lineHeight: 1.8, margin: "10px 0 0" }}>
          ★押したあと「★入っていません」に変われば、出られています。
          ★変わらなければ、出られていません。
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button type="button" style={btn} onClick={() => apply(null)}>ふつう</button>
        <button type="button" style={btn} onClick={() => apply("large")}>大きい</button>
        <button type="button" style={btn} onClick={() => apply("xlarge")}>とても大きい</button>
      </div>

      {/* ★見本。★本物と同じ書き方にしてあります。 */}
      <div style={box}>
        <h3 id="shindan-head" className="ff-display italic text-lg">見出しの見本（h3・text-lg）</h3>
        <p id="shindan-body" className="text-sm">本文の見本（text-sm）。この文が大きくなれば、倍率は効いています。</p>
        <div className="grid grid-cols-7 gap-1 text-center" style={{ marginTop: 10 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <div key={d} id={d === 1 ? "shindan-cell" : undefined}
              className="aspect-square rounded-lg flex items-center justify-center text-xs"
              style={{ border: "1px solid #ddd" }}>{d}</div>
          ))}
        </div>
        {/* ★★2026-09-05、★ここが足りませんでした。
            ★前の見本は、★きれいすぎて、★崩れる形になっていませんでした。
            ★本物には、★「縮まない箱」と「縮む文」が、★となり合っています。
            ★それが、★字1つぶんまで潰れる形です。 */}
        <div className="flex items-center gap-5 flex-wrap" style={{ marginTop: 12 }}>
          <div style={{ flexShrink: 0, minWidth: 0 }}>
            <span className="ff-display italic" style={{ fontSize: "1.7rem" }}>52</span>
            <span className="text-xs">／18日中</span>
          </div>
          <div style={{ flex: 1 }}>
            <p id="shindan-squeeze" className="text-xs">
              この18日のうち、今日は低いほうから7番目です。
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap" style={{ marginTop: 10 }}>
          <input readOnly value="ABCD1234"
            className="flex-1 rounded-lg border p-2 text-sm ff-mono"
            style={{ border: "1px solid #ddd", fontSize: "max(16px, 0.875rem)" }} />
          <button type="button" className="px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0"
            style={{ background: "#7A1F2B", color: "#FFFDF8" }}>確認する</button>
        </div>

        <div id="shindan-row" className="flex items-center justify-between" style={{ marginTop: 10, gap: 8 }}>
          <span className="text-sm">横に並ぶものの見本です</span>
          <button type="button" className="text-sm" style={{ border: "1px solid #ccc", borderRadius: 999, padding: "8px 14px" }}>
            教室に参加する
          </button>
        </div>
      </div>

      <div style={box}>
        <p style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 8px" }}>測った値</p>
        {sizes ? (
          <ul style={{ fontSize: "0.9375rem", lineHeight: 1.9, margin: 0, paddingLeft: 18 }}>
            <li>根（html）の文字：<strong>{sizes.root}</strong></li>
            <li>暦の升目の数字：<strong>{sizes.cell}</strong>（★とても大きい で 14px なら、効いています）</li>
            <li>本文：<strong>{sizes.body}</strong>（★ふつうより大きくなるはずです）</li>
            <li>見出し：<strong>{sizes.head}</strong>（★24px を超えないはずです）</li>
            <li>横並びの折り返し：<strong>{sizes.wrap}</strong>（★とても大きい で wrap なら、効いています）</li>
            <li>潰れていないか：<strong>{sizes.squeeze}</strong></li>
          </ul>
        ) : <p style={{ fontSize: "0.9375rem" }}>まだ測っていません。</p>}
      </div>

      <div style={box}>
        <p style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 8px" }}>決まりが届いているか</p>
        {rules ? (
          <ul style={{ fontSize: "0.9375rem", lineHeight: 1.9, margin: 0, paddingLeft: 18 }}>
            <li>暦の決まり：<strong>{rules.calendar} 本</strong></li>
            <li>折り返しの決まり：<strong>{rules.wrap} 本</strong></li>
            <li>見出しの決まり：<strong>{rules.heading} 本</strong></li>
          </ul>
        ) : null}
        <p style={{ fontSize: "0.875rem", lineHeight: 1.8, marginTop: 10, marginBottom: 0 }}>
          ★どれかが 0 本なら、この端末に新しい CSS が届いていません。
          0 本でないのに値が変わらないなら、別の決まりが勝っています。
        </p>
      </div>

      <p style={{ fontSize: "0.875rem", lineHeight: 1.8 }}>
        この画面の中身を、そのまま写して送っていただければ十分です。
      </p>
    </main>
  );
}
