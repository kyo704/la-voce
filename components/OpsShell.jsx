"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { tabsFor, maySeeMoney, HEALTH_WALL_LINE } from "@/lib/opsShell";

// ============================================================================
// 運営モード ── 別のシェル（見本⑪ ／ 2026-09-09・第3便）
//
//   ★出どころ docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §3-3
//
//   ★★この画面から、★生徒の健康の記録には たどりつけません。
//     ★★画面そのものが ありません（★§3-3）。
//     ★★出し分けでは ありません。★import して いません。
//       ★出し分けにすると、★条件を 1行 変えるだけで 出てしまいます。
//     ★見張り（ops-shell.test.js）が、★それを 確かめます。
//
//   ★★iPhone でも 使えます（★2026-09-09・坂本さんの お決め）。
//     ★見本⑪は PC・iPad ですが、★同じ6つの タブを iPhone の 幅に 収めます。
//     ★★「パソコン幅のときだけ」という 制限は 設けません。
//     ★★§4-7 の「先生を 横に並べる 一覧」だけが パソコンです。
//       ★これは 日程の 中の 1つの 見せ方の 話です。
//
//   ★★上から2番目に、★いつも この帯を 出します（★§3-3）。
//
//   ★数と 決めは lib/opsShell.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/ops-shell.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

// ★★はばを 見る仕掛けは、★ここから 外しました（★2026-09-09）。
//   ★§4-7 の「パソコンだけ」が 撤回され、★シェルは 幅を 見なくなりました。
//   ★★日程の 見せ方を 変えるための はばは、★日程の 画面が 自分で 見ます。
//     ★使わないものを、★ここに 残しません。

export default function OpsShell({ orgName, role, postName, myName,
  scaleLabel, onCycleScale, onBack, renderTab, children }) {
  const tabs = tabsFor(role);
  const [tab, setTab] = useState(tabs.length > 0 ? tabs[0].key : null);

  // ★★入れない役割に、★空のシェルを 出しません。
  //   ★呼ぶ側が 門を かけますが、★ここでも 止めます。★二重に します。
  if (tabs.length === 0) return null;
  const cur = tabs.some((t) => t.key === tab) ? tab : tabs[0].key;

  return (
    <div style={{ minHeight: "100dvh", background: C.paper, display: "flex", flexDirection: "column" }}>
      {/* ★★上の帯。★左上に「もどる」（★§3-3）。★個人のアプリへ 帰れます。 */}
      <div style={{
        background: C.curtain, color: "#FFFDF8", padding: "10px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 10, letterSpacing: "0.04em"
      }}>
        <button type="button" onClick={onBack}
          style={{
            background: "transparent", border: "none", color: "#FFFDF8",
            fontSize: "0.8125rem", minHeight: 40, padding: 0, flex: "none"
          }}>‹ もどる</button>
        <span style={{
          fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap", flex: 1, textAlign: "center"
        }}>{orgName} の運営</span>
        {/* ★★★役職の 名と お名前（★2026-09-18・裁定 ⑧）。
            ★出どころ 見本 `<span class="badge">'+S.post+'</span><span>坂本 響</span>`

            ★★きょうまで、★ここは「役職」の 3文字 でした。
              ★★2026-09-11 に できこと（Set）が 渡る ように なり、
                ★★Set を そのまま 描くと 何も 出ない ので、
                ★★「役職」と だけ 書いて ありました。
              ★★★名は **あった** のに、★渡して いません でした。
            ★★どの 役職で 見て いるかが 分かると、
              ★★お金の 欄が 出る／出ないの わけも 分かります。 */}
        <span style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
          {postName ? (
            /* ★★【後まわし・引き金は この 帯】── ★見本の 右がわ 6つの うち、
                 ★2つを 置いて いません（★2026-09-18・坂本さんの お決め）。
                 ★★① 未送信 N件 …… ★運営の 未送信を どこから 数えるか、
                   ★★まだ 決まって いません。★数えられない ものを 札に すると、
                     ★★押せない 札に なります（★§8⑤）。
                   ★★台帳に 記録のみ。★数の 出どころが 決まった 日に ここへ。
                 ★★② ◐ 端末に合わせる（明るさ）…… ★この 蔵に 明るさの 決めが
                   ★★**1つも ありません**（★`lib/displayPrefs.js` にも
                     ★`profiles` にも）。★だから「呼ぶ だけ」に できません。
                   ★★列を 足す／既定を 決める／端末の 設定を どう 読むか ──
                     ★★新しい 決めが 3つ 要ります。★当面 やりません。
                 ★★★この 帯を 直す 日に、★この 2つを 思い出して ください。 */
            <span style={{
              fontSize: "0.625rem", background: "rgba(255,253,248,0.18)",
              borderRadius: 99, padding: "3px 9px", whiteSpace: "nowrap"
            }}>{postName}</span>
          ) : (
            <span style={{ fontSize: "0.6875rem", opacity: 0.8 }}>
              {typeof role === "string" ? role : "役職"}
            </span>
          )}
          {myName ? (
            <span style={{
              fontSize: "0.6875rem", opacity: 0.9, whiteSpace: "nowrap",
              maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis"
            }}>{myName}</span>
          ) : null}

          {/* ★★文字の 大きさ（★2026-09-18・裁定 ⑧-4）。
              ★出どころ 見本 `<span class="rl" …>あ '+zLab()+'</span>`

              ★★★これは **近道** です。★新しい 決めでは ありません。
                ★★大きさは `lib/displayPrefs.js` が 持ちます。
                ★★`display_prefs` の 設定は、★もとから 運営にも かかって います
                  （★`SCALE_NOTE_BOLD`「運営モードにも 同じ設定が かかります」）。
                ★★★だから ここは、★同じ ものを 押せる ように した だけ です。
                  ★★2つめの 決めを 作って いません。
              ★★押すと 次の 大きさへ 回ります。★見本と 同じ 動き です。 */}
          {onCycleScale ? (
            <button type="button" onClick={onCycleScale}
              title={"文字の 大きさ（" + (scaleLabel || "") + "）"}
              style={{
                background: "rgba(255,253,248,0.18)", border: "none", color: "#FFFDF8",
                borderRadius: 99, padding: "3px 10px", fontSize: "0.625rem",
                minHeight: 28, whiteSpace: "nowrap", flex: "none"
              }}>あ {scaleLabel}</button>
          ) : null}
        </span>
      </div>

      {/* ★★健康の 線 ── ★上から 2番目（★§3-3 ／ ★裁定 2026-09-18・⑨）。
          ★★きょうまで、★この 断りは 設定の **いちばん 下** に ありました。
            ★★稟議で 見る 学長・事務長は、★そこまで 下りません。
            ★★学校に する 約束は、★いちばん 先に 目に 入る ところ に 置きます。
          ★★字は lib/opsShell.js が 持ちます。★ここでは 決めません。
          ★★どの 帯でも 出ます。★設定 だけでは ありません。 */}
      <div style={{
        flex: "none", display: "flex", alignItems: "center", gap: 8,
        background: "#F6EFDF", borderBottom: `1px solid ${C.line}`,
        padding: "7px 14px", fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.6
      }}>
        <span aria-hidden="true" style={{
          width: 7, height: 7, borderRadius: "50%", background: C.sage, flex: "none"
        }} />
        <span>{HEALTH_WALL_LINE}</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 16px" }}>
        {/* ★★§4-7 の「パソコンだけ」は 撤回されました（★2026-09-09）。
            ★★幅で 中身を 止めません。★見せ方を 変えるだけです。
              ★どの 見せ方に するかは lib/opsSchedule.js が 決めます。
            ★★どの帯に 何を 出すかは、★呼ぶ側が 決めます（renderTab）。
              ★シェルは 入れものです。★中身を 知りません。 */}
        <div className="space-y-3">{renderTab ? renderTab(cur) : children}</div>

        {/* ★★お金は owner だけ（★§1-1）。★admin には 出しません。 */}
        {cur === "settings" && !maySeeMoney(role) ? (
          <div style={card}>
            <p style={small}>お支払いのことは、教室の責任者の方がご覧になれます。</p>
          </div>
        ) : null}
      </div>

      {/* ★★下タブ。★役割で 数が 変わります（★§3-3）。
          ★★iPhone の 幅に 収めます。★6つでも 折り返しません。
            ★字を 小さくし、★はみ出す ぶんは 横に 送ります。 */}
      <div style={{
        display: "flex", borderTop: `1px solid ${C.line}`, background: "#FFF9F1",
        paddingBottom: "env(safe-area-inset-bottom)"
      }}>
        {tabs.map((t) => {
          const on = cur === t.key;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              aria-current={on ? "page" : undefined}
              style={{
                flex: 1, minWidth: 0, minHeight: 56,
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 5, border: "none", background: "transparent",
                // ★★色だけで 示しません。★上の 線でも 示します。
                color: on ? C.curtain : C.inkSoft,
                fontWeight: on ? 700 : 400,
                fontSize: tabs.length >= 6 ? "0.5625rem" : "0.625rem"
              }}>
              <span aria-hidden="true" style={{
                width: 16, height: 2, borderRadius: 2,
                background: on ? C.curtain : "transparent", display: "block"
              }} />
              <span style={{ whiteSpace: "nowrap" }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
