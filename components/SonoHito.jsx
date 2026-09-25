// ============================================================================
// ★その人 ── ★名簿の 1人の 中身（★2026-09-25・C群）
//
//   ★見本 `P_sonohito`（★運営の 見本・design-v76）。
//   ★★字と 決めは `lib/sonoHito.js` が 持ちます。★ここでは 決めません。
//
//   ★★★`entries` を 1度も 引きません。★健康の 列を 1つも 受け取りません。
//     ★★右の 8行が その 約束 です ──「画面が ありません」。
//   ★★広い ときだけ 2段に します（★見本の `col2`）。★狭い ときは 1段 です。
//   ★★★「招待中」は 台帳に ありません（★`enrollments_status_check` は 3つ）。
//     ★★だから「招き直す」も 出しません。★無い ものを 在る ように 見せません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import useWindowWidth from "@/components/useWindowWidth";
// ★★2つに 分ける 境目は 運営の ほかの 画面と 同じ もの を 使います。★ここで 決めません。
import { isTwoPane } from "@/lib/opsSettingsNav";
import { can, whoCan } from "@/lib/opsPerms";
import {
  BACK_TO, FACTS, ATTEND_HEAD, ATTEND_ROWS, timesWord,
  STATUS_HEAD, STATUS_NOW, STATUS_PICK, statusChoices, statusOf, countedWord,
  subLineOf, CHANGE_LOGGED, CANNOT_HEAD, CANNOT_WHO,
  HIDDEN_HEAD, HIDDEN_ROWS, HIDDEN_WORD, NOTE
} from "@/lib/sonoHito";

const box = {
  borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, overflow: "hidden"
};
const 行 = (i) => ({
  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
  gap: 12, padding: "11px 13px", borderTop: i === 0 ? "none" : `1px solid ${C.line}`
});
function H3({ children, first }) {
  return (
    <p style={{
      fontSize: "0.8125rem", color: C.ink, fontWeight: 600,
      margin: first ? "0 0 6px" : "15px 0 6px"
    }}>{children}</p>
  );
}

export default function SonoHito({
  name, grade, course, teacher, monka, enrollment, attendance, perms, posts,
  onPickStatus, onBack
}) {
  const w = useWindowWidth();
  const 二段 = isTwoPane(w);
  const いま = statusOf(enrollment);
  const 変えられる = can(perms, "meibo");
  const 数 = attendance || {};
  const 値 = [grade, course, teacher ? teacher + " 先生" : "—",
    monka ? monka + " の 門下" : "—", countedWord(enrollment)];

  const 左 = (
    <div>
      <div style={box}>
        {FACTS.map((f, i) => (
          <div key={f} style={行(i)}>
            <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>{f}</span>
            <span style={{ fontSize: "0.875rem", color: C.ink, textAlign: "right" }}>
              {値[i] || "—"}
            </span>
          </div>
        ))}
      </div>

      <H3>{ATTEND_HEAD}</H3>
      <div style={box}>
        {ATTEND_ROWS.map((r, i) => (
          <div key={r.key} style={行(i)}>
            <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>{r.label}</span>
            {/* ★★数 だけ です。★率も「9 / 12」の 形も 出しません（★裁定90 §4）。 */}
            <span style={{ fontSize: "0.875rem", color: C.ink }}>{timesWord(数[r.key])}</span>
          </div>
        ))}
      </div>

      <H3>{STATUS_HEAD}</H3>
      {変えられる ? (
        <>
          <div style={box}>
            {statusChoices().map((s, i) => (
              <button key={s.key} type="button"
                onClick={() => onPickStatus && s.key !== いま && onPickStatus(s.key, いま)}
                style={{
                  ...行(i), width: "100%", minHeight: 44, border: "none",
                  borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                  background: "transparent", textAlign: "left",
                  cursor: s.key === いま ? "default" : "pointer"
                }}>
                <span style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.9375rem", color: C.ink }}>{s.label}</span>
                  <span style={{
                    display: "block", fontSize: "0.75rem", color: C.inkSoft,
                    marginTop: 2, lineHeight: 1.8
                  }}>{s.note}</span>
                </span>
                <span style={{
                  fontSize: "0.75rem", whiteSpace: "nowrap",
                  color: s.key === いま ? C.sage : C.inkSoft,
                  fontWeight: s.key === いま ? 600 : 400
                }}>{s.key === いま ? STATUS_NOW : STATUS_PICK}</span>
              </button>
            ))}
          </div>
          {/* ★★★約束 です。★`ops_audit_log` に 置いて 初めて 本当 です。 */}
          <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "9px 0 0", lineHeight: 1.9 }}>
            {CHANGE_LOGGED}
          </p>
        </>
      ) : (
        <div style={{
          borderRadius: 10, border: `1px solid ${C.line}`, background: C.paper,
          padding: "11px 13px"
        }}>
          <p style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.9 }}>{CANNOT_HEAD}</p>
          <p style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.9 }}>
            {CANNOT_WHO}　<b>{whoCan(posts, "meibo")}</b>
          </p>
        </div>
      )}
    </div>
  );

  const 右 = (
    <div>
      <H3 first={二段}>{HIDDEN_HEAD}</H3>
      <div style={box}>
        {HIDDEN_ROWS.map((r, i) => (
          <div key={r} style={行(i)}>
            <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>{r}</span>
            <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>{HIDDEN_WORD}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={name || "—"} />
      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "-2px 0 11px", lineHeight: 1.85 }}>
        {subLineOf({ grade, course, teacher, enrollment })}
      </p>

      {二段 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
          {左}{右}
        </div>
      ) : (
        <div>{左}{右}</div>
      )}

      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "14px 0 0", lineHeight: 1.9 }}>
        {NOTE}
      </p>
    </div>
  );
}
