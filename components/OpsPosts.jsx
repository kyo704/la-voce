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

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, FONT_STACK, cardStyle, rem } from "@/lib/uiKit";
import { ScreenHead, HeadRound, Card, Li, Note, Warn } from "@/components/UiV2";
import {
  PERMS, isSchoolWide, permSet, tabsForPerms, mayGrant, CANNOT_GRANT_REASON
} from "@/lib/opsPerms";
import { tx } from "@/lib/t";

/** ★つまみ（★見本の .sw）。★色だけに 意味を 持たせません。★形でも 分かります。 */
function Switch({ on, disabled }) {
  return (
    <span aria-hidden="true" style={{
      width: 44, height: 26, borderRadius: 999, position: "relative", flex: "none",
      background: on ? (disabled ? C.line : C.curtain) : C.line,
      opacity: disabled ? 0.55 : 1
    }}>
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: 999, background: "#FFFDF8"
      }} />
    </span>
  );
}

/** ★できることを、★短い 1行に します（★見本の permLine）。 */
function permLine(perms) {
  const s = permSet(perms);
  if (s.size === 0) return tx("できることは、まだ ありません");
  return PERMS.filter((p) => s.has(p.key)).map((p) => p.label.split("を")[0]).join("・");
}

export default function OpsPosts({
  posts = [], countByPost = {}, myPerms, onAction, onClose, busy
}) {
  const [openId, setOpenId] = useState(null);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");

  const open = posts.find((p) => p.id === openId) || null;
  const run = async (payload) => {
    setMessage("");
    const err = await onAction(payload);
    if (err) setMessage(err);
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
        <div style={{ ...TYPE.usual, color: C.inkSoft, marginTop: -4, marginBottom: rem(10) }}>
          {tx("{n}人").replace("{n}", held)}
        </div>

        <div style={{ ...TYPE.mini, color: C.inkSoft, marginBottom: rem(6) }}>{tx("できること")}</div>
        <Card style={{ padding: `${rem(4)} ${rem(12)}` }}>
          {PERMS.map((p, i) => {
            const on = s.has(p.key);
            // ★★渡せるか。★決めは lib/opsPerms.js の mayGrant です。
            //   ★ここで 判じません。
            const allowed = mayGrant(myPerms, p.key);
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
                  color: allowed ? C.ink : "#A0917F"
                }}>
                <span>
                  {p.label}
                  {!isSchoolWide(p.key) ? (
                    <><br /><span style={{ ...TYPE.usual, color: C.inkSoft }}>
                      {tx("その方 自身にだけ かかります")}
                    </span></>
                  ) : null}
                </span>
                <Switch on={on} disabled={!allowed} />
              </button>
            );
          })}
        </Card>

        {/* ★★つまみを 切ると、★その場で タブが 変わります（★裁定 §7-3）。 */}
        <div style={{
          ...cardStyle, background: C.paper, borderColor: C.line, marginTop: rem(9)
        }}>
          <div style={{ ...TYPE.mini, lineHeight: 1.85 }}>
            <b>{tx("この役職で 出るタブ")}</b><br />
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

      {posts.length === 0 ? (
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
              background: C.curtain, color: "#FFFDF8", ...TYPE.li,
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
                {permLine(p.perms)}
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
                border: `1px solid ${C.curtain}`, background: C.curtain, color: "#FFFDF8",
                ...TYPE.li, fontFamily: FONT_STACK
              }}>{tx("足す")}</button>
          </div>
          {message ? <Warn>{message}</Warn> : null}
          <Note>
            {tx("足した 役職は、はじめは できることが 1つも ありません。押して 決めてください。")}<br />
            {tx("自分が 持っていない できることは、役職にも 付けられません。")}<br />
            {tx("その 役職の方が いる間は、消せません。")}
          </Note>
        </>
      ) : null}
    </div>
  );
}
