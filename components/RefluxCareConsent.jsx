"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { purposeByKey } from "@/lib/consent";

// ============================================================================
// 寝るときの姿勢と、締めつけ ── ★専用の同意画面（2026-09-08）
//
//   ★出どころ docs/lavoce-食事と就寝の設計.md §13-1
//
//     ・★オンにする前に、専用の同意画面を出す
//     ・「病歴に関わる情報を記録します」と明示する
//     ・保存先の国を明示する（外的環境の把握）
//     ・★第三者提供はしない、と明記する
//     ・consentAt が null のまま記録を作らせない
//
//   ★★病名を、★1文字も書きません（§14-1）。
//     ★「逆流性食道炎」とも「LPR」とも書きません。
//     ★★書けば、★この画面そのものが、★病名の記録になります。
//
//   ★★文面は lib/consent.js が持ちます。★ここで書き直さないこと。
//     ★2か所に別の文面があると、★どちらに同意したのか答えられません。
//
//   ★見張り components/tests/reflux-care.test.js
// ============================================================================

export default function RefluxCareConsent({ onAgree, onCancel, busy }) {
  const purpose = purposeByKey("health.reflux_care");
  const [checked, setChecked] = useState(false);
  if (!purpose) return null;

  return (
    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
      <h3 className="ff-display italic text-lg mb-2" style={{ color: C.ink }}>
        {purpose.label}
      </h3>

      {/* ★★文面は lib から そのまま出します。★ここで書き替えないこと。 */}
      <p className="text-sm" style={{ color: C.ink, lineHeight: 1.9 }}>
        {purpose.text}
      </p>

      {/* ★★何を書くのかを、★先に見せます。★同意してから驚かせません。 */}
      <div className="rounded-xl p-3 mt-3" style={{ background: C.paper }}>
        <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>記録するのは、この3つです</p>
        <ul className="text-xs" style={{ color: C.ink, lineHeight: 1.9, paddingLeft: "1.1em" }}>
          <li>寝るときの向き</li>
          <li>頭の側を上げたかどうか</li>
          <li>おなかを締めつけていたかどうか</li>
        </ul>
        {/* ★★測る数字を聞かない、と はっきり書きます。
            ★高さ（cm）も、点数も、聞きません。 */}
        <p className="text-xs mt-2" style={{ color: C.inkSoft, lineHeight: 1.8 }}>
          高さや点数は、うかがいません。あった／なかった、だけです。
        </p>
      </div>

      {/* ★★いつでも やめられることを、★同意の前に書きます。 */}
      <p className="text-xs mt-3" style={{ color: C.inkSoft, lineHeight: 1.8 }}>
        いつでもやめられます。やめても、それまでに書いたものは残ります。
        消したいときは、記録の書き出しと削除から、いつでも消せます。
      </p>

      {/* ★★押しただけで同意にしないこと。★確かめの印を、必ず1つ置きます。 */}
      <label className="flex items-start gap-2 mt-4" style={{ cursor: "pointer" }}>
        <input type="checkbox" checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ marginTop: 3, width: 18, height: 18 }} />
        <span className="text-sm" style={{ color: C.ink, lineHeight: 1.7 }}>
          上の内容を読み、記録することに同意します
        </span>
      </label>

      <div className="flex gap-2 mt-4">
        <button type="button"
          onClick={() => checked && onAgree && onAgree()}
          disabled={!checked || busy}
          className="flex-1 rounded-full text-sm font-medium"
          style={{
            minHeight: 48,
            background: checked ? C.curtain : C.line,
            color: checked ? "#FFFDF8" : C.inkSoft,
            border: "none", opacity: busy ? 0.6 : 1
          }}>
          {busy ? "…" : "同意して、記録を始める"}
        </button>
        {/* ★★出口を、必ず置きます。★出口のない画面を作らないこと。 */}
        <button type="button" onClick={() => onCancel && onCancel()} disabled={busy}
          className="flex-1 rounded-full text-sm border"
          style={{ minHeight: 48, borderColor: C.line, background: C.card, color: C.inkSoft }}>
          やめておく
        </button>
      </div>
    </div>
  );
}
