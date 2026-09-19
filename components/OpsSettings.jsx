"use client";

import { C } from "@/lib/tokens";
// ★★小見出しは UiV2 の H3 が 持ちます（★2026-09-18・裁定 ⑤）。
//   ★★字の 大きさも 字間も 余白も、★あちらの 決め です。
//   ★★ここで `<p style={small}>` を 書くと、★2つめの 決めに なります。
import { H3 } from "@/components/UiV2";
import { HEALTH_WALL_ITEMS, HEALTH_WALL_CARD_HEAD, HEALTH_WALL_CARD_VALUE }
  from "@/lib/opsShell";
// ★★お支払い（★裁定 その74・2026-09-18）。★字も 並びも lib が 持ちます。
import {
  CARD_HEAD as PAY_HEAD, NOT_SET_YET, NOT_QUALIFIED_INVOICE,
  billingRows, hasInvoiceNo
} from "@/lib/orgBilling";
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
// ★★★6段に 寄せました（★裁定 その103・2026-09-19）。
//   ★★11 → 12.5 …… ★3か所 とも「添える 字」の 役 です
//     ★①断りの 1行 ②役職と できこと の 1行 ③お支払いの 目安の 箱
const small = { fontSize: "0.78125rem", color: C.inkSoft, lineHeight: 1.8 };
const row = { display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "9px 0", borderTop: `1px solid ${C.line}`, fontSize: "0.8125rem" };

// ★★`NOT_HERE` は ここから 外しました（★2026-09-18・裁定 ⑨）。
//   ★★`lib/opsShell.js` の `HEALTH_WALL_ITEMS` が 持ちます。
//   ★★2か所に 置くと、★片方だけ 変わります。★それが この 蔵の 持病 です。

export default function OpsSettings({ members, staffLines, postName, perms, billing = null }) {
  const n = rosterCount(members);
  const fee = monthlyFee(n);
  // ★★どの 段も 下限に 届かなかった か。★印の 付け先が 変わります。
  const 下限が勝った = fee > 0 && !billPlans(n).some((p) => p.yen === fee);

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
        <p style={{ fontSize: "0.78125rem", color: C.inkSoft, lineHeight: 1.8, margin: 0 }}>
          {permHeadLine(postName, perms)}
        </p>
      ) : null}

      {/* ★★★小見出しは 箱の **外**・上 に 置きます（★2026-09-18・裁定 ⑤）。
          ★出どころ 見本 `stBill()` ──
            `<div class="h3" style="margin-top:0">今月の ご請求</div><div class="card">…`
          ★★きょうまで ── ★「今月の ご請求」には 小見出しが **ありません** でした。
            ★★「料金の 決まり」は 箱の **中**の 1行目 に ありました。
          ★★箱の 中に 置くと、★中身の 1行と 見分けが つきません。 */}
      <H3>今月の ご請求</H3>
      <div style={card}>
        <div style={{ ...row, borderTop: "none" }}>
          <span style={{ color: C.inkSoft }}>数える人数</span>
          <span style={{ color: C.ink }}>{n}人</span>
        </div>
        <div style={row}>
          <span style={{ color: C.inkSoft }}>1人あたり</span>
          <span style={{ color: C.ink }}>{n > 0 ? `${yen(perHead(n))}円` : "—"}</span>
        </div>
        {/* ★★今月の ご請求 だけ、★大きく 太く します（★2026-09-18・裁定 ⑦）。
            ★出どころ 見本 00-動く見本-PC・iPad（運営）.html の `stBill()`
              `<s style="font-size:22px;font-weight:700;color:var(--ink)">`
            ★★★はじめ 19px に して いました。★別の 画面の 数 でした。
              ★★19px は 名簿の 中の「いまの ご請求」（★見本 719行）です。
              ★★設定・ご請求 は `P_settei` → `stBill`（★見本 1058行）── ★22px。
              ★★同じ 字が 2か所に あり、★近い ほうを 拾って いました。
              ★★★どの 画面の 数か を 先に 決めて から 引きます。
            ★★見本の 字を そのまま 使います。★見た目で 合わせません。
            ★★ここは 稟議の 紙に 写される 1つの 数 です。
              ★★ほかの 行と 同じ 大きさ だと、★どれが その 数か 分かりません。 */}
        <div style={row}>
          <span style={{ color: C.inkSoft }}>今月のご請求</span>
          <span style={{ color: C.ink, fontSize: "1.375rem", fontWeight: 700 }}>
            {yen(fee)}円
          </span>
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
            fontSize: "0.78125rem", color: C.inkSoft, lineHeight: 2
          }}>
            {billPlans(n).map((p) => {
              // ★★★段が 勝った とき だけ 印を つけます。
              //   ★★下限が 勝った ときは、★どの 段にも つきません。
              //     ★★その ときの 印は、★下の 下限の 行 に つきます。
              const えらばれた = !下限が勝った && p.yen === fee;
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
            {/* ★★★下限が 勝った ときは、★下限の 行に 印を つけます
                （★2026-09-18・撮って 分かりました）。
                ★★見本は「どれかの 段が 勝つ」形 だけ を 考えて います。
                  ★★6人の 教室で 撮って みると ── ★どの 段にも 印が つかず、
                    ★★9,800円 が どこから 来たのか、★読んで 分かりません でした。
                ★★★内訳は「追える ように する」ため の もの です。
                  ★★勝った 行に 印が 無い 内訳は、★その 役目を 果たしません。 */}
            <div style={{
              color: 下限が勝った ? C.ink : C.inkSoft,
              fontWeight: 下限が勝った ? 700 : 400
            }}>
              {`下限 ${yen(MONTHLY_FLOOR)}円（下回りません）`}
              {下限が勝った ? "　←　いちばん 安いもの" : ""}
            </div>
          </div>
        ) : null}
      </div>

      {/* ★★料金の 決まり。★lib から 組み立てます。★書き写しません。 */}
      <H3>料金の 決まり</H3>
      <div style={card}>
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

      {/* ★★★お支払い（★裁定 その74・2026-09-18）。
          ★出どころ 見本 `stBill()` の「お支払い」の 箱。
          ★★★見本は 5行 です。★いま 出せるのは 3行 です。
            ★★出せない 2行（まとまり・引き落とし日）は、★台帳に 列が ありません。
            ★★★空の 行を 並べません。★学校に お出しする 画面 です。
              ★★空が 並ぶと 作りかけに 見えます。★信用を 落とします。
            ★★わけと 引き金は lib/orgBilling.js の `MISSING_ROWS` に あります。
          ★★★直す 札（支払い方法を 変える／宛先を 変える／領収書を 出す）は
            ★★まだ 置きません。★押した 先の 画面が ありません（★§8⑤）。 */}
      <H3>{PAY_HEAD}</H3>
      <div style={card}>
        {billing && billingRows(billing, fee).length > 0 ? (
          billingRows(billing, fee).map((r, i) => (
            <div key={r.key} style={{ ...row, ...(i === 0 ? { borderTop: "none" } : null) }}>
              <span style={{ color: C.inkSoft }}>{r.label}</span>
              <span style={{ color: C.ink }}>{r.value}</span>
            </div>
          ))
        ) : (
          <p style={{ ...small, margin: 0 }}>{NOT_SET_YET}</p>
        )}
        {/* ★★★登録番号が 無い ことを、★黙って いられません（★裁定 その74 追補）。
            ★★大学が 仕入税額控除を 受けられません。
            ★★★先に お伝えします。★あとから では 遅い こと です。 */}
        {!hasInvoiceNo(billing) ? (
          <p style={{ ...small, marginTop: 8, marginBottom: 0 }}>{NOT_QUALIFIED_INVOICE}</p>
        ) : null}
      </div>

      {/* ★★★戻しました（★2026-09-18・夕）。
          ★★★私の 報告が 誤って いました。
            ★★「見本＝上の 1行 ／ 実装＝下の カード」と、★二者択一の ように
              ★申し上げました。★実際は **見本は 両方 持って います**。
            ★★その 報告を もとに「最上部へ（移す）」と 裁定され、
              ★★私は 下の カードを 消しました。★見本に ある ものを 消しました。
            ★★見本を 下半分まで 撮り直して、★分かりました。
          ★★2つは 役目が ちがいます ──
            ★★上の 帯 …… ★約束の 宣言。★どの 帯でも 出ます。
            ★★この 箱 …… ★何が 無いかの 内訳。★4つ、★1つずつ。
          ★★中身は lib/opsShell.js が 持ちます。★ここでは 決めません。 */}
      <H3>{HEALTH_WALL_CARD_HEAD}</H3>
      <div style={card}>
        {HEALTH_WALL_ITEMS.map((x, i) => (
          <div key={x} style={{ ...row, ...(i === 0 ? { borderTop: "none" } : null) }}>
            {/* ★★薄い 字に します（★見本 `style="color:#A0917F"`）。
                ★★★見本の 色を そのまま 使いません。
                  ★★#A0917F は 紙の 上で 4.5 に 届きません。
                  ★★読みやすさが 勝ちます（★2026-09-13・坂本さんの お決め）。
                ★★token の `inkSoft` に します。★薄さの 役目は 果たします。 */}
            <span style={{ color: C.inkSoft }}>{x}</span>
            <span style={{ color: C.inkSoft }}>{HEALTH_WALL_CARD_VALUE}</span>
          </div>
        ))}
      </div>

      {/* ★★（もとの 注）★この画面から 見られないもの ── ★上の 線にも 出ます
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
