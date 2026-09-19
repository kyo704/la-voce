"use client";
// ============================================================================
// ★ひとと 役職（★見本 `P_settei` の 節 11 `stPeople`）
//
//   ★出どころ　裁定 その72 以降の 第2群（★2026-09-18・坂本さん 承認）
//
//   ★★ここが いま、★いちばん 詰まって いた ところ です ──
//     ★★役職（できこと）を **作れる**のに、★**人に 付けられません** でした。
//     ★★`OpsPosts` は 役職の **型**を 作る 画面 です。
//     ★★A2 で できことの 道が 1本に なった いま、★この 1枚が 要ります。
//
//   ★★★見本は 6列 です ── お名前／学部・研究科／学科・コース／事務の 分野／
//     役職／確かめ。★けれど 台帳に **4列が ありません**（★照会で 確定）。
//     ★★だから 出すのは **2列 だけ** です（★坂本さんの お決め ㋑）。
//     ★★★空の 列を 並べません。★「まだ 入れて いない だけ」に 見えます。
//       ★★本当は「置き場が 無い」です。★ちがう ことを 伝えます。
//     ★★4列と「学校の 形」の 画面は、★台帳に 引き金つきで 残して あります。
//
//   ★見張り components/tests/ops-people.test.js
// ============================================================================

import { useState } from "react";
import { C } from "@/lib/tokens";
// ★★学校の 形（★裁定 その98・2026-09-19）。★決めは lib が 持ちます。
import {
  choosableFor, divisionOf, shapeLineOf, parentNameOf,
  SHAPE_HEAD, SHAPE_HINT, SHAPE_NONE, SHAPE_EMPTY
} from "@/lib/orgDivisions";
import { mayChangePerson, mayGrantPost, permSet, can, permLine } from "@/lib/opsPerms";

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14 };
const row = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  gap: 10, padding: "11px 12px", borderTop: `1px solid ${C.line}`
};
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

/** ★絞りの 札。★見本の `chip` と 同じ 考えです。 */
function Chip({ on, children, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      fontSize: "0.6875rem", padding: "4px 10px", borderRadius: 999,
      border: `1px solid ${on ? C.curtain : C.line}`,
      background: on ? C.curtain : "transparent",
      color: on ? C.onCurtain : C.inkSoft, cursor: "pointer"
    }}>{children}</button>
  );
}

/**
 * @param members    その学校の memberships の 行
 * @param posts      その学校の org_posts の 行
 * @param nameOf     user_id → お名前（★読めなければ 空）
 * @param myPerms    自分の できこと
 * @param busy       送って いる あいだ true
 * @param onAssign   (userId, postId | null) => Promise
 */
/**
 * ★役職を 決める 1枚の 注（★見本 `P_setPost` の `.note`）。
 *
 *   ★★見本の とおり 3行 です。
 *
 *   ★★★2行目は、★きょう まで 書けません でした。
 *     ★★台帳に、★役職を 変えた 記録が 無かった から です。
 *     ★★★書けば 嘘に なる ので、★書きません でした。
 *     ★★2026-09-18、★坂本さんの お決めで `post_change_log` を 作りました。
 *       ★★お金の 宛先（`atesaki_changed_at` / `atesaki_changed_by`）と 同じ 考え です。
 *       ★★`app/api/org/posts/route.js` の `記録する()` が、
 *         ★★役職を 付けた とき・外した とき に 1行 残します。
 *     ★★★記録が 先、★言葉が あと。★順を 変えません。
 */
const PEOPLE_NOTE = Object.freeze([
  "役職が そのまま「できること」です。別に「役割」は ありません。",
  "変えた記録は 残ります（誰が・いつ・誰を）。",
  "どの 役職でも、生徒の 声・からだの 記録・ノート・時間割の 中身には 画面が ありません。"
]);

export default function OpsPeople({
  members, posts, nameOf, myPerms, busy, onAssign, nameFetchFailedLabel,
  // ★★★学校の 形（★裁定 その98・2026-09-19）。
  //   ★`divisions` … ★`org_divisions` の 行
  //   ★`onSetDivision` … ★その方の 形を 決める（★`memberships.division_id`）
  //   ★★渡されなければ、★その 節ごと 出しません（★押せない 札を 置きません）。
  divisions = [], onSetDivision,
  // ★★★確かめ（★見本 `P_setPost` の warn・2026-09-19）。
  //   ★★`verified_at` が 空なら「ご自分で 選んだまま」です。
  //   ★★渡されなければ、★その 節ごと 出しません（★押せない 札を 置きません）。
  onVerify
}) {
  const [filter, setFilter] = useState({ k: "全て", v: "" });
  const [open, setOpen] = useState(null);   // ★いま 開いて いる 方の user_id
  const [failed, setFailed] = useState(false);

  const list = (members || []).filter((m) => m && m.user_id);
  const byId = Object.fromEntries((posts || []).map((p) => [p.id, p]));
  const shown = filter.k === "役職"
    ? list.filter((m) => (byId[m.post_id] || {}).name === filter.v)
    : (filter.k === "形"
      ? list.filter((m) => m.division_id === filter.v)
      : list);

  // ★★「変えられるか」は lib が 決めます。★ここで 役職の 名を くらべません。
  const canChange = (m) => mayChangePerson(myPerms, byId[m.post_id] || null);

  const target = open ? list.find((m) => m.user_id === open) : null;

  return (
    <div className="space-y-3">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.ink, margin: 0 }}>
          ひとと 役職
        </p>
        <span style={small}>{shown.length}／{list.length}</span>
      </div>
      {/* ★★★何を する 画面か を 書きます（★2026-09-19・実機の ご報告）。
          ★★「そもそも 何を する 画面か 分かりにくい」と 伺いました。
          ★★★役職を 作るのは 別の 節 です（★役職と、できること）。
            ★★ここは、★その 役職を **人に 付ける** ところ です。 */}
      <p style={small}>この学校の 方に、役職を 渡します。</p>
      <p style={small}>
        役職そのものを 作るのは「役職と、できること」です。お名前を 押すと、
        渡す 役職を 選べます。
      </p>
      {/* ★★★ご自分の 役職は、★ご自分で 変えられません（★裁定 その99 F4）。
          ★★「確かめる」が 出ない わけも、★同じ ところに 書きます。 */}
      <p style={small}>
        ご自分の 役職は、ご自分で 変えられません。
        「確かめる」も、ご自分には 出ません。
      </p>

      {/* ★★★絞り（★2026-09-19・裁定 その98 で 形の 表が できました）。
          ★★きょうまで 2つ でした（★全て ／ 役職）。
            ★★学部・学科・分野は、★台帳に 置き場が ありません でした。
          ★★★いまは `org_divisions` が あります。★学科と 分野で 絞れます。
            ★★学部で 絞るのは、★その 学部の 学科を まとめて 見る こと です
              ★★（★`parent_id` で たどります）。
          ★★未確認（★ご自分で 選んだまま）は、★まだ 置き場が ありません。
            ★★出しません。★「まだ 入れて いない だけ」に 見えます。 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Chip on={filter.k === "全て"} onClick={() => setFilter({ k: "全て", v: "" })}>
          全て
        </Chip>
        {(posts || []).map((p) => (
          <Chip key={p.id} on={filter.k === "役職" && filter.v === p.name}
            onClick={() => setFilter({ k: "役職", v: p.name })}>{p.name}</Chip>
        ))}
        {choosableFor(divisions).map((d) => (
          <Chip key={d.id} on={filter.k === "形" && filter.v === d.id}
            onClick={() => setFilter({ k: "形", v: d.id })}>{d.name}</Chip>
        ))}
      </div>

      <div style={card}>
        {list.length <= 1 ? (
          /* ★★★ほかに 誰も いない とき（★裁定 その99 F4）。
              ★★1人＝ご自分 だけ です。★渡す 相手が いません。 */
          <div style={{ padding: 22, textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: C.ink, margin: 0 }}>
              まだ、ほかの 方が いません。
            </p>
            <p style={{ ...small, margin: "4px 0 0" }}>名簿から 招いて ください。</p>
          </div>
        ) : shown.length === 0 ? (
          <p style={{ ...small, padding: 22, textAlign: "center", margin: 0 }}>
            この 絞りに あう方は いません
          </p>
        ) : shown.map((m, i) => {
          const post = byId[m.post_id] || null;
          const ok = canChange(m);
          return (
            <div key={m.user_id} style={{ ...row, borderTop: i === 0 ? "none" : row.borderTop }}>
              <span style={{ fontSize: "0.8125rem", color: C.ink, minWidth: 0 }}>
                {nameOf(m.user_id) || nameFetchFailedLabel || ""}
              </span>
              {/* ★★押せない 方には、★押しどころを 出しません（★§8⑤）。
                  ★★見本は 押すと「あなたの 役職では 変えられません」と 出します。
                    ★★こちらは **出さない** ほうに しました ──
                      ★押せる ように 見せて 断るより、★はじめから 出さない。 */}
              {ok ? (
                <button type="button" disabled={busy}
                  onClick={() => { setFailed(false); setOpen(m.user_id); }}
                  style={{
                    fontSize: "0.75rem", color: C.curtain, background: "none",
                    border: "none", cursor: busy ? "default" : "pointer", padding: 0
                  }}>
                  {post ? post.name : "役職なし"} ›
                </button>
              ) : (
                <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>
                  {post ? post.name : "役職なし"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ★★役職を 変える 1枚。★別の 画面に せず、★同じ ところで 開きます。 */}
      {target ? (
        <div style={{ ...card, padding: 12 }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>
            {nameOf(target.user_id) || nameFetchFailedLabel || ""} の 役職
          </p>
          {/* ★★★ご自分で 選んだ まま かどうか（★見本 `P_setPost` の warn）。
              ★★確かめると、★誰が いつ 確かめたかが 残ります。
              ★★★責めません。★「合って いれば 押して ください」だけ です。 */}
          {onVerify && !target.verified_at ? (
            <div style={{ ...card, background: C.paper, borderColor: C.line, padding: 10,
              marginBottom: 8 }}>
              <p style={{ ...small, margin: 0, color: C.ink }}>
                この方は ご自分で 選んだ ままです。合って いれば、確かめて ください。
              </p>
              <button type="button" disabled={busy}
                onClick={async () => {
                  const r = await onVerify(target.user_id);
                  if (r === false) setFailed(true);
                }}
                style={{
                  minHeight: 44, marginTop: 8, padding: "0 14px", borderRadius: 999,
                  border: `1px solid ${C.curtain}`, background: C.card, color: C.ink,
                  fontSize: "0.75rem"
                }}>確かめる</button>
            </div>
          ) : null}
          {onVerify && target.verified_at ? (
            <p style={{ ...small, margin: "0 0 8px" }}>
              {`確かめました　${String(target.verified_at).slice(0, 10)}`}
            </p>
          ) : null}

          {/* ★★★いまの 形（★見本 `P_setPost` の `sub`・2026-09-19）。
              ★★学部・学科・分野の 3つ。★無い ものは「—」です。
              ★★★学部は 選ばせません。★学科の 上に ついて いる ものです。 */}
          {(() => {
            const 形 = shapeLineOf(divisions, target);
            return (
              <p style={{ ...small, margin: "0 0 8px" }}>
                {`学部・研究科　${形.faculty}　／　学科・コース　${形.department}`
                  + `　／　事務の 分野　${形.field}`}
              </p>
            );
          })()}
          {(posts || []).map((p) => {
            // ★★付けられるかは lib が 決めます（★自分より 強い 人を 作れない）。
            const grantable = mayGrantPost(myPerms, p);
            return (
              <div key={p.id} style={row}>
                {/* ★★★役職の 名の 下に、★できことを 出します（★見本 `P_setPost`）。
                    ★★名だけ 出して いました。
                    ★★★「学科長に する」と 押す とき、★何を 渡すのかが
                      ★★名からは 分かりません。★渡す ものを 見せます。
                    ★★字は lib/opsPerms.js の `permLine` が 作ります。 */}
                <span style={{ fontSize: "0.8125rem", color: grantable ? C.ink : C.inkSoft,
                  minWidth: 0, flex: 1 }}>
                  {p.name}
                  <br />
                  <span style={small}>{permLine(p.perms)}</span>
                </span>
                {grantable ? (
                  <button type="button" disabled={busy}
                    onClick={async () => {
                      const r = await onAssign(target.user_id, p.id);
                      if (r === false) { setFailed(true); return; }
                      setFailed(false); setOpen(null);
                    }}
                    style={{
                      fontSize: "0.75rem", color: C.curtain, background: "none",
                      border: "none", cursor: busy ? "default" : "pointer", padding: 0
                    }}>
                    {target.post_id === p.id ? "いま この 役職" : "この 役職に する"}
                  </button>
                ) : (
                  // ★★渡せない わけを 隠しません（★裁定 §7-4）。
                  <span style={small}>あなたが 持って いない できことは、渡せません。</span>
                )}
              </div>
            );
          })}

          {/* ★★★学校の 形（★見本 `P_setPost` の 3つの 札・2026-09-19）。
              ★★選ぶのは 学科 か 分野 です。★学部は 学科から 出ます。
              ★★★`memberships.division_id` は 1つ です。★2つ 持ちません。
                ★★学部と 学科を 別々に 持つと、★食い違う 行が できます。
              ★★形が 1つも 無ければ、★その 節ごと 出しません（★§8⑤）。 */}
          {onSetDivision ? (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>
                {SHAPE_HEAD}
              </p>
              {choosableFor(divisions).length === 0 ? (
                <p style={small}>{SHAPE_EMPTY}</p>
              ) : (
                <>
                  <p style={small}>{SHAPE_HINT}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {choosableFor(divisions).map((d) => (
                      <Chip key={d.id} on={target.division_id === d.id}
                        onClick={async () => {
                          const r = await onSetDivision(target.user_id,
                            target.division_id === d.id ? null : d.id);
                          if (r === false) setFailed(true);
                        }}>
                        {d.kind === "department" && parentNameOf(divisions, d)
                          ? `${parentNameOf(divisions, d)}／${d.name}` : d.name}
                      </Chip>
                    ))}
                  </div>
                  {!divisionOf(divisions, target) ? (
                    <p style={small}>{SHAPE_NONE}</p>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
          <div style={row}>
            <span style={{ fontSize: "0.8125rem", color: C.ink }}>役職を 外す</span>
            <button type="button" disabled={busy}
              onClick={async () => {
                const r = await onAssign(target.user_id, null);
                if (r === false) { setFailed(true); return; }
                setFailed(false); setOpen(null);
              }}
              style={{
                fontSize: "0.75rem", color: C.curtain, background: "none",
                border: "none", cursor: busy ? "default" : "pointer", padding: 0
              }}>外す</button>
          </div>
          {/* ★★★見本の 注（★`P_setPost` の `.note`・3行）。
              ★★3行 のうち、★出せるのは **2行** です。
              ★★★出せない 1行 ──「変えた記録は 残ります（誰が・いつ・誰を）」
                ★★台帳に、★役職を 変えた 記録が **ありません**（★2026-09-18 に 尋ねました）。
                ★★`memberships` に 列は なく、★引き金も、★記録の 表も ありません。
                ★★★書けば 嘘に なります。★書きません。
                ★★（★お金の 宛先には `atesaki_changed_at` / `atesaki_changed_by` が
                  ★★あります ── ★同じ 考えを、★役職には まだ 入れて いません）
                ★★【後まわし・引き金は この 注】── ★記録の 表を 作る 日に、
                  ★★この 1行を 足して ください。 */}
          <p style={{ ...small, margin: "8px 2px 0" }}>
            {PEOPLE_NOTE.map((line) => (<span key={line}>{line}<br /></span>))}
          </p>

          {/* ★★できなかった ことを、★画面に 出します。★黙って 閉じません。 */}
          {failed ? (
            <p style={{ ...small, color: C.curtain, margin: "8px 2px 0" }}>
              変えられませんでした。時間を おいて、もう一度 お試しください。
            </p>
          ) : null}
          <div style={{ marginTop: 8 }}>
            <button type="button" onClick={() => { setFailed(false); setOpen(null); }}
              style={{
                fontSize: "0.75rem", color: C.inkSoft, background: "none",
                border: "none", cursor: "pointer", padding: 0
              }}>閉じる</button>
          </div>
        </div>
      ) : null}

      {/* ★★★2026-09-19 ── ★出して いない ものが 無く なりました。
          ★★学部・学科・分野 …… ★裁定 その98 で 台帳が できました。
          ★★確かめ …… ★`memberships.verified_at` を 足しました。
          ★★★だから、★ここに 断りを 置きません。★無い ものが ありません。 */}
    </div>
  );
}
