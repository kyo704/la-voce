// ============================================================================
// ★★★配役を 決める ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定141（公演の 運営）／ design-v36 の 直し ①④
//     ／ 見本 `P_haiyaku`（`SC['配役を決める']`）
//        woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//
//   ★★台帳の 形（★見本の 言葉と ちがいます）──
//     `koen_slots`   … ★役（label）と 声（group_kind）
//     `koen_cells`   … ★場面 × 役 に 入る 方（member_id）と 人数（people）
//     `koen_members` … ★出演者。★B キャストは `is_understudy` ＋ `covers_slot_id`
//   ★★★A と B を 持つ 列は ありません。★A は 入って いる 方、
//     ★B は「その 役を 代わる」と 印の ついた 方 です。
//
//   ★★★体の ことは 1つも 扱いません（★裁定141）。★受け取る 形も 作りません。
// ============================================================================

export const COLS_SLOT = "id, koen_id, label, slot_kind, sort_order, group_kind";
export const COLS_CELL = "row_id, slot_id, member_id, people";
export const COLS_MEMBER = "id, koen_id, user_id, name_at, part, is_understudy, covers_slot_id, left_at";

/** ★A（いま 入って いる 方）と B（代わる 方）を 組み立てます。 */
export function castRows(slots, cells, members) {
  // ★★★`C` と 名づけません。★`C` は 色の 束の 名 です（`lib/tokens.js`）。
  //   ★★見張り（no-missing-token）が `C.find` を「無い 色」と 読みます。
  //     ★色の 見張りが 赤に なると、★本物の 色の まちがいが 埋もれます。
  const 役 = Array.isArray(slots) ? slots : [];
  const マス = Array.isArray(cells) ? cells : [];
  const 人 = (Array.isArray(members) ? members : []).filter((m) => m && !m.left_at);
  const 名 = {};
  人.forEach((m) => { 名[m.id] = m.name_at || ""; });
  return 役.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((s) => {
    // ★★A …… その 役の マスに 入って いる 方（★どの 場面でも 同じ 方 です）
    const c = マス.find((x) => x.slot_id === s.id && x.member_id);
    const b = 人.find((m) => m.is_understudy && m.covers_slot_id === s.id);
    return {
      slot: s,
      a: c ? { id: c.member_id, name: 名[c.member_id] || "" } : null,
      b: b ? { id: b.id, name: b.name_at || "" } : null,
      people: peopleOf(マス, s.id)
    };
  });
}

/**
 * ★その 役に 何人 入るか。
 *
 *   ★★★design-v36 の 直し ④ ── ★札では 決められません。
 *     ★「37人」の ような 半端な 数が あります。★打ち込みで 決めます。
 *   ★★入って いなければ null（★0 では ありません）。
 *     ★0 と 書くと「0人 と 決めた」に 見えます。★「まだ」と 別 です。
 */
export function peopleOf(cells, slotId) {
  const c = (Array.isArray(cells) ? cells : []).find((x) => x.slot_id === slotId && x.people != null);
  return c ? Number(c.people) : null;
}

/** ★人数を 打ち込んで よい 役か（★合唱・オーケストラ など、★1人では ない 役）。 */
export function isGroupSlot(slot) {
  return Boolean(slot) && (slot.slot_kind === "group" || slot.group_kind === "group");
}

/**
 * ★打ち込まれた 人数を 読みます。
 *
 *   ★★空は null（★まだ 決めて いない）。
 *   ★★★0 より 小さい 数、★数でない 字は 受け取りません（null）。
 *     ★上は 決めません ── ★合唱 500人の 公演も あり得ます。
 */
export function readPeople(v) {
  const s = String(v == null ? "" : v).trim();
  if (s === "") return null;
  if (!/^[0-9]+$/.test(s)) return null;
  const n = Number(s);
  return n >= 0 ? n : null;
}

/** ★直せる 公演か（★期限が 切れて いたら 直せません）。 */
export function canEditKoen(koen) {
  if (!koen) return false;
  if (koen.status && koen.status !== "open") return false;
  if (!koen.valid_until) return true;
  return new Date(koen.valid_until).getTime() >= Date.now();
}

/** ★役を 足せるか（★役の 名が 要ります）。 */
export function canAddRole(name) {
  return String(name == null ? "" : name).trim() !== "";
}

/** ★役を 足す ときの 形。★名は 60字まで。 */
export function newRole(name, voice, order) {
  return {
    label: String(name || "").trim().slice(0, 60),
    group_kind: String(voice || "").trim().slice(0, 30) || null,
    sort_order: Number(order) || 0
  };
}

/** ★見本の 言葉（★1字 も 足しません）。 */
export const CAST_HOW = "A・B の マスを 押すと、入れる 方を 選べます。";
export const CAST_PICK_NOTE = "招いた 方から 選びます。入れ替えると、まだ 先の 稽古の 呼び出しも 変わります。";
export const CAST_EMPTY = "まだ 役が ありません";
export const CAST_ADD_HEAD = "役を 足す";
export const CAST_NEXT = "次へ　出演者を 招く";
export const CAST_NOTE = Object.freeze([
  "ダブルキャストは A・B に 分けます。合唱は「合唱」を 1役として 足し、人数は 招いた 数で 数えます。",
  "キャストは、まだ 決まっていなくても 先に 役だけ 足せます。"
]);
export const CAST_NEED_NAME = "役を 入れてください";
export const CAST_PUT = "入れました";

/** ★打ち込みの 枠の 例（★見本の placeholder）。 */
export const CAST_FIELDS = Object.freeze([
  { key: "r", label: "役", example: "パミーナ" },
  { key: "v", label: "声", example: "ソプラノ" },
  { key: "a", label: "A キャスト", example: "（招いた方から）" },
  { key: "b", label: "B キャスト（任意）", example: "" }
]);
