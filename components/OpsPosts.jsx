"use client";

// ============================================================================
// 役職と、できること ── 一覧 と 中身（★見本 SC['役職の一覧'] ／ SC['役職の中身']）
//
//   ★出どころ docs/design/pack-final/裁定-9月10日夜の7点（役職への一本化ほか）.md §7
//
//   ★★裁定 §7-3「役職の 中身の 画面に『この役職で 出るタブ』を 出しています。
//     ★つまみを 切ると、★その場で タブが 変わります」
//   ★★裁定 §7-4「渡せない つまみを 灰色に して、押すと 理由を 出します。★隠しません」
//
//   ★★書くのは サーバの 道（/api/org/posts）です。
//     ★画面には 書く 権限を 渡していません。
//     ★★灰色は 見た目です。★守りは サーバに あります。
//
//   ★見張り components/tests/ops-posts.test.js
// ============================================================================

import { useEffect, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, FONT_STACK, cardStyle, rem } from "@/lib/uiKit";
import { ScreenHead, HeadRound, Card, Li, Note, Warn } from "@/components/UiV2";
import {
  PERMS, isSchoolWide, permSet, tabsForPerms, mayGrant, permLine, CANNOT_GRANT_REASON
} from "@/lib/opsPerms";
import { tx } from "@/lib/t";
// ★★役職 × できこと の 表（★裁定 その75 修正・2026-09-18）。
//   ★★930px 以上でだけ 出します。★測った 幅（905px）より 小さいと 横に すべります。
import OpsPostMatrix from "@/components/OpsPostMatrix";
import { showTable, NAV_ROW_HEAD } from "@/lib/opsPostMatrix";

/**
 * ★つまみ（★見本の .sw）。★色だけに 意味を 持たせません。★形でも 分かります。
 *
 *   ★★2026-09-13、★2つの ことを 1つの 色で 言って いました ──
 *     ★「入って いる／切れて いる」と「触れる／触れない」。
 *     ★★`on かつ disabled` の 背が `C.line` で、★**切れて いる ときと 同じ 色**。
 *       ★★だから「入って いるが 触れない」が、★「切れて いる」に 見えました。
 *       ★★実機で「動かない」と ご報告を いただいた ときの、★見え方の 根です
 *         （★実際には 動いて いました）。
 *
 *   ★★いまは 2つを 分けて います ──
 *     ★背　　… ★入って いるか どうか（★curtain／line）
 *     ★薄さ … ★触れるか どうか（★1／0.55）
 *     ★玉の 位置 … ★入って いるか どうか（★右／左）
 *   ★★1つの ことに 1つの しるし。★重ねません。
 */
function Switch({ on, disabled }) {
  return (
    <span aria-hidden="true" style={{
      // ★★2026-09-13、★つまみが 消えました（★実機の ご報告）。
      //   ★★`<span>` は 既定で inline です。★幅と 高さが 効きません。
      //   ★★それまでは flex の 子だったので、★自動で 塊に なって いました。
      //     ★★「送って います」の ために もう 1枚 包んだ とき、
      //       ★★flex の 子では なく なり、★inline に 戻って 潰れました。
      //   ★★親に 頼らない ように、★自分で 塊に します。
      display: "inline-block",
      width: 44, height: 26, borderRadius: 999, position: "relative", flex: "none",
      background: on ? C.curtain : C.line,
      opacity: disabled ? 0.55 : 1
    }}>
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: 999, background: "#FFFDF8"
      }} />
    </span>
  );
}

/**
 * ★できることを、★**短い** 1行に します。
 *
 *   ★★★`lib/opsPerms.js` にも `permLine` が あります。★別の もの です。
 *     ★★あちら … ★名を そのまま、★「 ／ 」で つなぐ（★見本の `permLine`）。
 *       ★★題の 下の 1行 に 使います。★1つずつ 読める 形 です。
 *     ★★こちら … ★「を」より 前だけ、★「・」で つなぐ。
 *       ★★札の 中の 1行 に 使います。★10枚 並ぶ ので、★短く します。
 *   ★★★同じ 名だと、★次に 読む 方が「写しだ」と 思って 片方を 消します。
 *     ★★名を 変えました。★消すと 別の ものが 消えます。
 */
function permLineShort(perms) {
  const s = permSet(perms);
  if (s.size === 0) return tx("できることは、まだ ありません");
  return PERMS.filter((p) => s.has(p.key)).map((p) => p.label.split("を")[0]).join("・");
}

export default function OpsPosts({
  posts = [], countByPost = {}, myPerms, myPostId = null, onAction, onClose, busy
}) {
  const [openId, setOpenId] = useState(null);
  // ★★幅を 見ます（★`components/Renraku.jsx` と 同じ 形）。
  //   ★★はじめは null です。★分からない うちは 表を 出しません
  //     （★出して から 縮めない）。
  const [winW, setWinW] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const on = () => setWinW(window.innerWidth);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const [newName, setNewName] = useState("");
  // ★★名前を 直す ときの 下書き。★null は「まだ 触って いない」。
  //   ★★空の 字（""）と 分けます。★空に して 保存させない ため です。
  const [renaming, setRenaming] = useState(null);
  const [message, setMessage] = useState("");
  // ★★いま 送って いる できことの 鍵（★2026-09-13・実機の ご報告）。
  //   ★★「ラグが 長すぎて 反応して いないのかと 思う」。
  //   ★★往復が 2回 あります ── ★① サーバへ 書く ★② 台帳へ 読みに 行く。
  //     ★★②が 終わる まで、★つまみは 1ミリも 動きません。
  //   ★★先に 動かす（★楽観）ことは しません ──
  //     ★書けて いないのに 書けたように 見せるのは、★この家の 決めに 反します。
  //   ★★代わりに、★押した **その行** に「送って います」を 出します。
  const [sending, setSending] = useState(null);

  const open = posts.find((p) => p.id === openId) || null;
  const run = async (payload) => {
    // ★★押した ことが、★すぐ 目に 見えるように します。
    //   ★★通信が 遅いと、★押しても 何も 起きないように 見えます。
    if (payload.action === "perm") setSending(payload.key);
    setMessage(tx("送っています…"));
    const err = await onAction(payload);
    setSending(null);
    if (err) { setMessage(err); return; }
    // ★★済んだ ことを、★字でも 言います（★2026-09-13）。
    //   ★★つまみは 絵です。★絵だけだと、★変わったかが 分かりにくい。
    //   ★★とくに 通信が 2秒ほど かかるので、★その あいだ 何も 起きません。
    if (payload.action === "perm") {
      setMessage(payload.on ? tx("入れました") : tx("外しました"));
    } else {
      setMessage("");
    }
  };

  // ── 中身 ─────────────────────────────────────────────
  if (open) {
    const held = countByPost[open.id] || 0;
    const s = permSet(open.perms);
    const tabs = tabsForPerms(s);
    return (
      <div style={{ fontFamily: FONT_STACK }}>
        <ScreenHead title={open.name}
          right={<HeadRound mark="‹" label={tx("もどる")} onClick={() => setOpenId(null)} />} />
        {/* ★★題の 下の 1行（★見本 `P_postDetail` の `sub`）。
            ★★見本は「n人　／　できことの 列挙」です。
              ★★人数だけ 出して いました。★できことが 抜けて いました。
            ★★名は そのまま 出します（★`lib/opsPerms.js` の `permLine`）。
              ★★短く すると、★どれが 入って いるか 読み取れません。 */}
        <div style={{ ...TYPE.usual, color: C.inkSoft, marginTop: -4, marginBottom: rem(10) }}>
          {tx("{n}人").replace("{n}", held)}　／　{permLine(open.perms)}
        </div>

        {/* ★★★名前を 直す（★見本 `P_postDetail` の `postRename`）。
            ★★★サーバには ずっと ありました（`action: "rename"`）。
              ★★画面から 呼ぶ ところが ありません でした。
              ★★★書いた のに、★どこからも 呼ばれて いない ── ★N-1 の 決まり。
            ★★「ひとの 役職を 変える」を 持つ 方だけ 直せます。
              ★★持たない 方には、★入れる口を 出しません（★§8⑤）。 */}
        {mayGrant(myPerms, "post") ? (
          <>
            <div style={{ ...TYPE.mini, color: C.inkSoft, marginBottom: rem(6) }}>
              {tx("名前")}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: rem(12) }}>
              <input type="text" value={renaming === null ? open.name : renaming}
                onChange={(e) => setRenaming(e.target.value.slice(0, 40))}
                style={{
                  flex: 1, minWidth: 0, minHeight: 48, borderRadius: 12, padding: `0 ${rem(13)}`,
                  border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: "1rem"
                }} />
              <button type="button"
                disabled={busy || renaming === null || renaming.trim() === "" || renaming === open.name}
                onClick={() => run({ action: "rename", postId: open.id, name: renaming.trim() })
                  .then(() => setRenaming(null))}
                style={{
                  width: 84, minHeight: 48, borderRadius: 12, flex: "none",
                  border: `1px solid ${C.curtain}`, ...TYPE.li,
                  background: C.curtain, color: "#FFFDF8", fontFamily: FONT_STACK
                }}>{tx("直す")}</button>
            </div>
          </>
        ) : null}

        <div style={{ ...TYPE.mini, color: C.inkSoft, marginBottom: rem(6) }}>{tx("できること")}</div>
        <Card style={{ padding: `${rem(4)} ${rem(12)}` }}>
          {PERMS.map((p, i) => {
            const on = s.has(p.key);
            // ★★渡せるか。★決めは lib/opsPerms.js の mayGrant です。
            //   ★ここで 判じません。
            // ★★★自分の 役職か どうかを 渡します（★裁定 その77・monka_read）。
            //   ★★`master` を 持つ 方は、★`monka_read` を 人に 渡せます。
            //     ★★けれど **自分の 役職には 付けられません**。
            //     ★★付けられると、★1人で 門下の やりとりを 読める ように なります。
            //   ★★判じるのは lib/opsPerms.js です。★ここでは 決めません。
            const allowed = mayGrant(myPerms, p.key,
              { toMyOwnPost: !!myPostId && open.id === myPostId });
            return (
              <button key={p.key} type="button" disabled={busy}
                onClick={() => (allowed
                  ? run({ action: "perm", postId: open.id, key: p.key, on: !on })
                  : setMessage(CANNOT_GRANT_REASON))}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 10, width: "100%", textAlign: "left", minHeight: 52,
                  padding: `${rem(9)} 0`, background: "transparent", border: "none",
                  borderBottom: i === PERMS.length - 1 ? "none" : `1px solid ${C.line2}`,
                  ...TYPE.li, fontFamily: FONT_STACK,
                  // ★★灰色に します。★隠しません（★裁定 §7-4）。
                  color: allowed ? C.ink : C.inkFaint
                }}>
                <span>
                  {p.label}
                  {sending === p.key ? (
                    <><br /><span style={{ ...TYPE.usual, color: C.curtain }}>
                      {tx("送って います…")}
                    </span></>
                  ) : !isSchoolWide(p.key) ? (
                    <><br /><span style={{ ...TYPE.usual, color: C.inkSoft }}>
                      {tx("その方 自身にだけ かかります")}
                    </span></>
                  ) : null}
                </span>
                {/* ★★送って いる あいだは、★その行の つまみだけ 薄く します。
                    ★★押した ことが 見えます。★ほかの 行は そのままです。 */}
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  opacity: sending === p.key ? 0.4 : 1, flex: "none"
                }}>
                  <Switch on={on} disabled={!allowed} />
                </span>
              </button>
            );
          })}
        </Card>

        {/* ★★つまみを 切ると、★その場で タブが 変わります（★裁定 §7-3）。 */}
        <div style={{
          ...cardStyle, background: C.paper, borderColor: C.line, marginTop: rem(9)
        }}>
          <div style={{ ...TYPE.mini, lineHeight: 1.85 }}>
            <b>{NAV_ROW_HEAD}</b><br />
            <span style={{ color: C.inkSoft }}>
              {tabs.length ? tabs.map((t) => t.label).join("　／　") : tx("1つも 出ません")}
            </span>
          </div>
        </div>

        {held > 0 ? (
          <Note>{tx("この役職の方が {n}人 いるので 消せません").replace("{n}", held)}</Note>
        ) : (
          <button type="button" disabled={busy}
            onClick={() => run({ action: "delete", postId: open.id }).then(() => setOpenId(null))}
            style={{
              width: "100%", minHeight: 48, marginTop: rem(10), borderRadius: 12,
              border: `1px solid ${C.line}`, background: C.card, color: C.ink,
              ...TYPE.li, fontFamily: FONT_STACK
            }}>{tx("この役職を 消す")}</button>
        )}

        {message ? <Warn>{message}</Warn> : null}

        <Note>
          <b>{tx("できることを 変えると、その役職の方 全部に すぐ かかります。")}</b><br />
          {tx("灰色の 行は、学校全部に かかるのに あなたが 持っていない ものです。渡せません。")}<br />
          {tx("「その方 自身にだけ かかる」ものは、持っていなくても 渡せます")}<br />
          {tx("　（学長は 教えなくても、教授に「自分の 日程を 組む」を 渡せます）。")}<br />
          {tx("門下の 代表は ここに ありません（その門下の 先生だけが 決めます）。")}
        </Note>
      </div>
    );
  }

  // ── 一覧 ─────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={tx("役職と、できること")}
        right={onClose
          ? <HeadRound mark="‹" label={tx("もどる")} onClick={onClose} />
          : null} />
      <Warn>
        {tx("この学校の 役職です。")}<b>{tx("役職が そのまま「できること」")}</b>{tx("に なります。")}<br />
        {tx("足す・消す・できることを 変える ── 全部 この学校の 中だけです。")}
      </Warn>

      {/* ★★2026-09-11、★ここに わけが 出ていませんでした。
          ★★0件の ときの 枝の 中に、message を 書いていなかったためです。
            ★★ボタンを 押して 失敗しても、★画面に 何も 出ませんでした。
            ★実機で「押しても 何も 起きない」と ご報告を いただきました。★そのとおりです。
          ★★だから、★枝の 外に 出しました。★どの 姿でも 見えます。 */}
      {message ? (
        <div style={{ ...cardStyle, background: C.paper, borderColor: C.line, marginBottom: rem(9) }}>
          <p style={{ ...TYPE.li, color: C.ink }}>{message}</p>
        </div>
      ) : null}

      {/* ★★★広い ときは 表、★狭い ときは 札（★裁定 その75 修正）。
          ★★どちらも 見本に ある 形 です。★片方を 捨てて いません。
            ★表 … `00-動く見本-PC・iPad（運営）.html`
            ★札 … `00-動く見本（さわれる・全画面）.html`
          ★★境目は lib/opsPostMatrix.js の `TABLE_AT`（930）。
            ★★測った 数 です（★表の 実の 幅 905px ＋ 余白）。 */}
      {posts.length > 0 && showTable(winW) ? (
        <OpsPostMatrix
          posts={posts} countByPost={countByPost}
          myPerms={myPerms} myPostId={myPostId} busy={busy}
          onOpen={(id) => setOpenId(id)}
          onToggle={(postId, key, on) => run({ action: "perm", postId, key, on })} />
      ) : posts.length === 0 ? (
        <>
          {/* ★★1つも 無いとき。★こちらで 勝手に 作りません（★器の SQL §4）。
              ★押した その方の 手で 作ります。★誰が いつ 作ったかが 残ります。 */}
          <Card>
            <Li last>{tx("まだ、役職が ありません。")}</Li>
          </Card>
          <button type="button" disabled={busy}
            onClick={() => run({ action: "template" })}
            style={{
              width: "100%", minHeight: 52, marginTop: rem(10), borderRadius: 12,
              border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
              ...TYPE.li, background: C.curtain, color: "#FFFDF8",
              fontWeight: 700, fontFamily: FONT_STACK
            }}>{tx("はじめの ひな型を 作る")}</button>
          <Note>
            {tx("学長・副学長・事務長・学部長・学科長・教授・准教授・講師・課長・職員 の 10を 作ります。")}<br />
            {tx("作ったあと、名前も できることも、いくらでも 変えられます。")}
          </Note>
        </>
      ) : (
        posts.map((p) => (
          <button key={p.id} type="button" onClick={() => setOpenId(p.id)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 10, width: "100%", textAlign: "left", minHeight: 56,
              ...cardStyle, marginBottom: rem(7), fontFamily: FONT_STACK
            }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: rem(13.5), fontWeight: 700, color: C.ink }}>{p.name}</span><br />
              <span style={{ ...TYPE.usual, color: C.inkSoft, lineHeight: 1.6 }}>
                {permLineShort(p.perms)}
              </span>
              {/* ★★★この 役職で 出る ナビ（★裁定 その75・STEP_1）。
                  ★出どころ 見本 `stPost()` の いちばん 下の 行「この役職で 出るナビ」。
                    ★★見本では 表の 最下段に あります。★ここでは 札の 中に 置きます。
                    ★★表は PC・iPad だけ です。★この 札は どの 幅でも 出ます。
                  ★★★見本の `navOf()` を **書き写しません**。
                    ★★`tabsForPerms`（lib/opsPerms.js）を 呼びます。
                    ★★2つは 3つの 役職で 食い違います ──
                      ★教授・准教授・講師 … ★見本は「設定」を 出します。
                      ★★実装は 出しません。★`koma_mine` を 条件から 外して います。
                      ★★注（2026-09-11）「入れると、教授に 学校の 設定が 開きます。漏れです」
                    ★★★実装の ほうが 正しい です。★見本に 合わせません
                      （★2026-09-18・坂本さん ご承認）。
                  ★★ここで 組み立てると、★同じ 決めが 2か所に なります。 */}
              <br />
              <span style={{ ...TYPE.mini, color: C.inkSoft, lineHeight: 1.6 }}>
                {tx("出る ナビ")}　{tabsForPerms(p.perms).length > 0
                  ? tabsForPerms(p.perms).map((t) => t.label).join("・")
                  : tx("（入れません）")}
              </span>
            </span>
            <span style={{ ...TYPE.mini, color: C.inkSoft, flex: "none" }}>
              {tx("{n}人").replace("{n}", countByPost[p.id] || 0)}
            </span>
          </button>
        ))
      )}

      {posts.length > 0 ? (
        <>
          <div style={{ ...TYPE.mini, color: C.inkSoft, margin: `${rem(12)} 0 ${rem(6)}` }}>
            {tx("役職を 足す")}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" value={newName}
              onChange={(e) => setNewName(e.target.value.slice(0, 40))}
              placeholder={tx("れい：特任教授／主任／園長")}
              style={{
                flex: 1, minWidth: 0, minHeight: 48, borderRadius: 12, padding: `0 ${rem(13)}`,
                border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: "1rem"
              }} />
            <button type="button" disabled={busy || newName.trim() === ""}
              onClick={() => run({ action: "add", name: newName.trim() }).then(() => setNewName(""))}
              style={{
                width: 84, minHeight: 48, borderRadius: 12, flex: "none",
                border: `1px solid ${C.curtain}`, ...TYPE.li,
                background: C.curtain, color: "#FFFDF8", fontFamily: FONT_STACK
              }}>{tx("足す")}</button>
          </div>
          {/* ★★★注を 畳みます（★裁定 その75・STEP_1）。
              ★出どころ 見本の `foldNotes()` ── ★`.note` を ぜんぶ 畳んで、
                ★「くわしい 決まりを 見る」の 札を 前に 置いて います。
              ★★★私は「行き先の ある 札」だと 思って いました。★ちがいます。
                ★★押すと **その場で 開きます**。★画面は 変わりません。
              ★★札の 字は `components/UiV2.jsx` の `NOTE_OPEN` / `NOTE_CLOSE`。
                ★★見本の `textContent` を 1文字も 変えて いません。 */}
          <Note fold>
            {tx("足した 役職は、はじめは できることが 1つも ありません。押して 決めてください。")}<br />
            {tx("自分が 持っていない できることは、役職にも 付けられません。")}<br />
            {tx("その 役職の方が いる間は、消せません。")}
          </Note>
        </>
      ) : null}
    </div>
  );
}
