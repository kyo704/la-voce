"use client";

import { C } from "@/lib/tokens";
import { permHeadLine } from "@/lib/opsPerms";
import {
  rosterCount, monthlyFee, perHead, yen, billPlans,
  TIERS, MONTHLY_FLOOR, SETUP_FEE, SETUP_FEE_FROM, YEARLY_FREE_MONTHS,
  PRICE_TAX_LABEL, PRICE_TAX_ROW_LABEL
} from "@/lib/orgRoster";

// ============================================================================
// 設定・ご請求 ── 見本⑤（2026-09-09・第3便）
//
//   ★出どころ docs/opus/woolsong-見本-運営モード8点（9月9日）.jpg ⑤
//
//   ★★この画面が 見られないもの（★見本⑤の 下の 欄）
//     ★生徒の 声の記録　　★画面が ありません
//     ★生徒の からだの記録★画面が ありません
//     ★生徒の ノート　　　★画面が ありません
//   ★★「見せない」では ありません。★画面が 無い、です。
//     ★だから、★ここに その旨を 書けます。★嘘に なりません。
//
//   ★★お金の 決めは lib/orgRoster.js が 持ちます。★ここでは 決めません。
//     ★料金の 表も、★その lib から 組み立てます。
//     ★★書き写すと、★値上げの ときに 片方だけ 直ります。
//
//   ★見張り components/tests/org-roster.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };
const row = { display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "9px 0", borderTop: `1px solid ${C.line}`, fontSize: "0.8125rem" };

// ★★`NOT_HERE` は ここから 外しました（★2026-09-18・裁定 ⑨）。
//   ★★`lib/opsShell.js` の `HEALTH_WALL_ITEMS` が 持ちます。
//   ★★2か所に 置くと、★片方だけ 変わります。★それが この 蔵の 持病 です。

export default function OpsSettings({ members, staffLines, postName, perms }) {
  const n = rosterCount(members);
  const fee = monthlyFee(n);

  return (
    <div className="space-y-3">
      <h2 className="ff-display italic" style={{ fontSize: "1.25rem", color: C.ink }}>設定・ご請求</h2>

      {/* ★★題の 下の 1行 ── ★「あなたは 何を 持って いるか」（★2026-09-18）。
          ★出どころ 見本 00-動く見本-PC・iPad（運営）.html の `permLine`。
          ★★★A2 で、★役割の 名では 何も 開かなく なりました。
            ★★開くのは できこと だけ です。
            ★★ところが その できことが、★画面の どこにも 出て いません でした。
            ★★押しても 何も 起きない ときの わけが、★見た方に 分かりません。
          ★★文の 組み立ては lib/opsPerms.js が 持ちます。★ここでは 決めません。
            ★★並びも 区切りも 見本と 同じ です。
          ★★★見本は これを **どの 運営の 画面にも** 置いて います。
            ★★いまは 設定 だけ です。★節を 作る 日に、★帯の ほうへ 上げます
              （★台帳㊽・引き金は この 行）。 */}
      {perms !== undefined ? (
        <p style={{ fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8, margin: 0 }}>
          {permHeadLine(postName, perms)}
        </p>
      ) : null}

      {/* ★★いまの ご請求。★数えるだけです。 */}
      <div style={card}>
        <div style={{ ...row, borderTop: "none" }}>
          <span style={{ color: C.inkSoft }}>数える人数</span>
          <span style={{ color: C.ink }}>{n}人</span>
        </div>
        <div style={row}>
          <span style={{ color: C.inkSoft }}>1人あたり</span>
          <span style={{ color: C.ink }}>{n > 0 ? `${yen(perHead(n))}円` : "—"}</span>
        </div>
        <div style={row}>
          <span style={{ color: C.inkSoft }}>今月のご請求</span>
          <span style={{ color: C.ink }}>{yen(fee)}円</span>
        </div>

        {/* ★★計算の 内訳（★2026-09-18・裁定 ⑥）。
            ★★★「稟議の 数字です。★無いと 通りません」（★Opus・2026-09-18）。
              ★★9月10日の 見立て ──「月75,000円の 稟議を 通す 数字が まだ 無い」。
            ★★どの段で いくらに なるか を、★3行 とも 出します。
              ★★安いほうを 当てた、と 書くだけでは 追えません。
              ★★★当てなかった ほうも 出して はじめて、★確かめられます。
            ★★数は lib/orgRoster.js の `billPlans` が 出します。
              ★★`monthlyFee` も 同じ 関数を 使います。★内訳と 答えは ずれません。
            ★★5人までは 0円 です（★裁定）。★その ときは 内訳を 出しません。
              ★★出すと「77,600円」だけが 目に 入り、★0円が 伝わりません。 */}
        {fee > 0 ? (
          <div style={{
            background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10,
            padding: "10px 12px", marginTop: 10,
            fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 2
          }}>
            {billPlans(n).map((p) => {
              const えらばれた = p.yen === fee;
              return (
                <div key={p.rate} style={{
                  color: えらばれた ? C.ink : C.inkSoft,
                  fontWeight: えらばれた ? 700 : 400
                }}>
                  {`${p.heads}人 × ${p.rate}円　＝ ${yen(p.yen)}円`}
                  {えらばれた ? "　←　いちばん 安いもの" : ""}
                </div>
              );
            })}
            <div>{`下限 ${yen(MONTHLY_FLOOR)}円（下回りません）`}</div>
          </div>
        ) : null}
      </div>

      {/* ★★料金の 決まり。★lib から 組み立てます。★書き写しません。 */}
      <div style={card}>
        <p style={{ ...small, marginBottom: 2 }}>料金の 決まり</p>
        {TIERS.map((tr, i) => (
          <div key={tr.rate} style={row}>
            <span style={{ color: C.inkSoft }}>
              {i === 0 ? "名簿1人あたり" : `名簿${tr.min}人以上`}
            </span>
            <span style={{ color: C.ink }}>月 {yen(tr.rate)}円</span>
          </div>
        ))}
        <div style={row}>
          <span style={{ color: C.inkSoft }}>月額の下限</span>
          <span style={{ color: C.ink }}>{yen(MONTHLY_FLOOR)}円</span>
        </div>
        <div style={row}>
          <span style={{ color: C.inkSoft }}>初期費用（名簿{SETUP_FEE_FROM}人以上）</span>
          <span style={{ color: C.ink }}>{yen(SETUP_FEE)}円</span>
        </div>
        {/* ★★★2026-09-18、★「表示　税別」を 足しました。
            ★★見本の 料金の 決まりの 5行目 です。★実装に 1文字も ありません でした。
            ★★お金の 表示 です。★9,800円が 税込に 見えると、★ご請求と 食い違います。
            ★★字は `lib/orgRoster.js` が 持ちます。★ここに 書き写しません。 */}
        <div style={row}>
          <span style={{ color: C.inkSoft }}>{PRICE_TAX_ROW_LABEL}</span>
          <span style={{ color: C.ink }}>{PRICE_TAX_LABEL}</span>
        </div>
        <div style={row}>
          <span style={{ color: C.inkSoft }}>年の一括前払い</span>
          <span style={{ color: C.ink }}>{YEARLY_FREE_MONTHS}か月分を引きます</span>
        </div>
        {/* ★★数えない人を、★はっきり 書きます（★§10）。
            ★あとから「先生も 数えられていた」と ならないためです。 */}
        <div style={row}>
          <span style={{ color: C.inkSoft }}>先生・事務の方</span>
          <span style={{ color: C.ink }}>何人でも 数えません</span>
        </div>
        <div style={row}>
          <span style={{ color: C.inkSoft }}>休会中の方</span>
          <span style={{ color: C.ink }}>数えません</span>
        </div>
      </div>

      {/* ★★人の 割り（★見本⑤）。★呼ぶ側が 渡します。 */}
      {(staffLines || []).length > 0 ? (
        <div style={card}>
          <p style={{ ...small, marginBottom: 2 }}>人の 割り</p>
          {staffLines.map((s) => (
            <div key={s.key || s.name} style={row}>
              <span style={{ color: C.ink }}>{s.name}</span>
              <span style={small}>{s.note}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* ★★★この画面から 見られないもの ── ★上の 線に 移しました
          （★2026-09-18・裁定 ⑨）。
          ★★ここ（いちばん 下）に カードで 3行 並べて いました。
            ★★稟議で 見る 学長・事務長が、★そこまで 下りません。
          ★★いまは `components/OpsShell.jsx` の 上から 2番目の 線 に 出ます。
            ★★設定 だけでなく、★運営の どの 帯でも 出ます。
          ★★3つの 中身は `lib/opsShell.js` の `HEALTH_WALL_ITEMS` に あります。
            ★★消して いません。★見せ方を 変えた だけ です。 */}
    </div>
  );
}
