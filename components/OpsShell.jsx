"use client";

import { useEffect, useState } from "react";
import { C } from "@/lib/tokens";
import { tabsFor, maySeeMoney, HEALTH_WALL_LINE } from "@/lib/opsShell";
// ★★見た目の 土台（★裁定 その78・その81 §8 の ①②③）。
//   ★★この 中 だけ に かかります。★門の 外の 画面は 1つも 変わりません。
import VisualTokens, { SCOPE_CLASS } from "@/components/VisualTokens";
// ★★左の ナビ・さがす（★裁定 その78 §2 §4 §6）。
import useWindowWidth from "@/components/useWindowWidth";
import OpsNav from "@/components/OpsNav";
import OpsSearch from "@/components/OpsSearch";
import { showSideNav, isRail, FOLD_KEY } from "@/lib/opsNav";
import { OPEN_KEY } from "@/lib/opsSearch";

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
// ★★★12より 小さい 字を 使いません（★裁定 その103・2026-09-19）。
//   ★★11 → 12.5（★注記の 段）。★9〜10.5 は 12 へ。
//   ★★役で 寄せて います。★近い 値で 寄せて いません。
const small = { fontSize: "0.78125rem", color: C.inkSoft, lineHeight: 1.8 };

// ★★はばを 見る仕掛けは、★ここから 外しました（★2026-09-09）。
//   ★§4-7 の「パソコンだけ」が 撤回され、★シェルは 幅を 見なくなりました。
//   ★★日程の 見せ方を 変えるための はばは、★日程の 画面が 自分で 見ます。
//     ★使わないものを、★ここに 残しません。

export default function OpsShell({ orgName, role, postName, myName,
  scaleLabel, onCycleScale, onBack, renderTab, children }) {
  const tabs = tabsFor(role);
  const [tab, setTab] = useState(tabs.length > 0 ? tabs[0].key : null);

  // ★★★左の ナビ（★裁定 その78 §2）。
  //   ★★iPhone では 出しません。★下の 帯の まま です（★2026-09-09 の お決め）。
  //   ★★たたむのは 手（★Ctrl / ⌘ + B）と、★表の 画面 ＋ iPad の とき だけ。
  //   ★★決めは lib/opsNav.js が 持ちます。★ここでは 判じません。
  const width = useWindowWidth();
  const [folded, setFolded] = useState(false);
  const [searching, setSearching] = useState(false);

  // ★★押しどころ。★⌘K で さがす、★⌘B で たたむ（★裁定 §6-2 ／ §4-3）。
  //   ★★字の 中に いる ときは 効かせません。★打って いる 手を 奪いません。
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const on = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = String(e.key || "").toLowerCase();
      if (k === OPEN_KEY) { e.preventDefault(); setSearching(true); }
      else if (k === FOLD_KEY) { e.preventDefault(); setFolded((x) => !x); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  // ★★入れない役割に、★空のシェルを 出しません。
  //   ★呼ぶ側が 門を かけますが、★ここでも 止めます。★二重に します。
  if (tabs.length === 0) return null;
  const cur = tabs.some((t) => t.key === tab) ? tab : tabs[0].key;
  const 横に出す = showSideNav(width);
  const 現在の名 = (tabs.find((t) => t.key === cur) || {}).label;
  const たたむ = isRail({ manual: folded, screen: 現在の名, width });
  const 移る = (key) => { if (tabs.some((t) => t.key === key)) setTab(key); };

  return (
    /* ★★★`wsv` ── ★見た目の 土台が かかる 入れ物 です（★裁定 その81 §8）。
         ★★この 名の 中 だけ で、★色（`--ink` など）と 表の 貼り付けが 効きます。
         ★★★`:root` に 置いて いません。★38人の 画面は 1つも 変わりません
           （★2026-09-09 の お指図）。
         ★★運営の 表は みな この 中に あります。★`.tblwrap` が 一度に 効きます。 */
    <div className={SCOPE_CLASS}
      style={{ minHeight: "100dvh", background: C.paper, display: "flex", flexDirection: "column" }}>
      <VisualTokens />
      {/* ★★上の帯。★左上に「もどる」（★§3-3）。★個人のアプリへ 帰れます。 */}
      <div style={{
        background: C.curtain, color: C.onCurtain, padding: "10px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 10, letterSpacing: "0.04em"
      }}>
        <button type="button" onClick={onBack}
          style={{
            background: "transparent", border: "none", color: C.onCurtain,
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
              fontSize: "0.75rem", background: C.onCurtainFaint,
              borderRadius: 99, padding: "3px 9px", whiteSpace: "nowrap"
            }}>{postName}</span>
          ) : (
            <span style={{ fontSize: "0.78125rem", opacity: 0.8 }}>
              {typeof role === "string" ? role : "役職"}
            </span>
          )}
          {myName ? (
            <span style={{
              fontSize: "0.78125rem", opacity: 0.9, whiteSpace: "nowrap",
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
                background: C.onCurtainFaint, border: "none", color: C.onCurtain,
                borderRadius: 99, padding: "3px 10px", fontSize: "0.75rem",
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
        background: C.opsBand, borderBottom: `1px solid ${C.line}`,
        padding: "7px 14px", fontSize: "0.78125rem", color: C.inkSoft, lineHeight: 1.6
      }}>
        <span aria-hidden="true" style={{
          width: 7, height: 7, borderRadius: "50%", background: C.sage, flex: "none"
        }} />
        <span>{HEALTH_WALL_LINE}</span>
      </div>

      {/* ★★★左の ナビ ＋ 中身。★横に 並べます（★裁定 その78 §1）。
           ★★iPhone では ナビを 出しません。★下の 帯の まま です。 */}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {横に出す ? (
          <OpsNav perms={role} current={cur} onGo={移る}
            rail={たたむ} onToggleRail={() => setFolded((x) => !x)} />
        ) : null}

      <div style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "12px 14px 16px" }}>
        {/* ★★§4-7 の「パソコンだけ」は 撤回されました（★2026-09-09）。
            ★★幅で 中身を 止めません。★見せ方を 変えるだけです。
              ★どの 見せ方に するかは lib/opsSchedule.js が 決めます。
            ★★どの帯に 何を 出すかは、★呼ぶ側が 決めます（renderTab）。
              ★シェルは 入れものです。★中身を 知りません。 */}
        {/* ★★★帯を 移る 道を、★中身に 渡します（★2026-09-18）。
            ★★きょうまで、★中身から 帯を 移れません でした。
              ★★`OpsHome` の「日程を 見る」の 札が 出ない のは、
                ★★渡す 先が 無かった から です。
            ★★★勝手に 移りません。★中身が 押された ときだけ です。
            ★★出て いない 帯には 移りません（★下の `tabs.some`）。
              ★★できことの 無い 帯に 移ると、★空の 画面が 出ます。 */}
        <div className="space-y-3">
          {renderTab
            ? renderTab(cur, (key) => { if (tabs.some((t) => t.key === key)) setTab(key); })
            : children}
        </div>

        {/* ★★お金は owner だけ（★§1-1）。★admin には 出しません。 */}
        {cur === "settings" && !maySeeMoney(role) ? (
          <div style={card}>
            <p style={small}>お支払いのことは、教室の責任者の方がご覧になれます。</p>
          </div>
        ) : null}
      </div>
      </div>

      {/* ★★さがす（★⌘K）。★ナビの 代わりでは ありません。★足すだけ です。 */}
      {searching ? (
        <OpsSearch perms={role} onGo={移る} onClose={() => setSearching(false)} />
      ) : null}

      {/* ★★下タブ。★役割で 数が 変わります（★§3-3）。
          ★★iPhone の 幅に 収めます。★6つでも 折り返しません。
            ★字を 小さくし、★はみ出す ぶんは 横に 送ります。
          ★★★左に ナビが 出て いる ときは、★こちらを 出しません（★裁定 その78 §1）。
            ★★同じ ところへ 行く 入口が 2つ あると、★どちらが 本当か 分かりません。
            ★★iPhone では これが 唯一の 入口 です。★消しません。 */}
      {横に出す ? null : (
      <div style={{
        display: "flex", borderTop: `1px solid ${C.line}`, background: C.opsFoot,
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
                // ★★★9px／10px でした（★裁定 その103 で 12 へ）。
                //   ★★6つ 以上の ときに 小さく する 分けは、★要らなく なりました。
                //     ★★どちらも 12 に なります。★分けが 意味を 持ちません。
                //   ★★★幅が 足りるかは 実機で お確かめ ください（★7つの とき）。
                fontSize: "0.75rem"
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
      )}
    </div>
  );
}
