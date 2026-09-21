// ============================================================================
// ★書き出す（★校務システムへ）── ★見本 `stExport`・裁定 その97 C群
//
//   ★★★出せない ものを、★**選べない** ように します。
//     ★★体・声・ノート・受診用の 1枚・連絡の 本文 ── ★一覧に すら 入れません。
//     ★★「切り忘れ」が 起きません。★これが この 画面の 一番の 決め です。
//
//   ★★★出す たびに 記録が 残ります（★誰が・いつ・何を）。
//     ★★個人の ことを 外へ 出す 行い だからです。
//
//   ★★★いま できる 形は CSV だけ です。
//     ★★Excel・iCalendar・Shift_JIS は `EXPORT_NOT_YET` に 書きました。
//     ★★★押せない 札を 置きません（★§8⑤）。★選べる ものだけ 出します。
//
//   ★見張り components/tests/ops-export.test.js
// ============================================================================

import { permSet } from "@/lib/opsPerms";

/**
 * ★出せる もの（★見本 `EXP_COLS` の 並びの とおり）。
 *
 *   `cols` … ★`[うちの 見出し, 鍵]`。★鍵は 下の `rowsFor` が 使います。
 *   `any`  … ★できこと（★1つでも 持って いれば 出せます）
 *   `all`  … ★すべて 持って いる ことが 要る できこと
 *
 *   ★★★見本の 列の うち、★この 蔵に 無い ものは 置いて いません。
 *     ★★「学部・研究科」と「学科・コース」は、★`org_divisions` の 木 です。
 *       ★★2段 と 決まって いません。★だから「所属」と「上の 所属」に します。
 */
export const EXPORT_SETS = Object.freeze([
  {
    key: "meibo", label: "名簿", any: ["meibo"],
    cols: [["学籍番号", "student_number"], ["氏名", "name"], ["氏名カナ", "kana"],
      ["所属", "division"], ["上の 所属", "division_parent"], ["学年", "grade"],
      ["担当の 先生", "teacher"], ["状態", "status"], ["入学年月", "since"]]
  },
  {
    key: "lesson", label: "レッスンの 日程", any: ["sched_all", "sched_mine"],
    cols: [["日付", "date"], ["曜日", "dow"], ["開始", "start"], ["終了", "end"],
      ["先生", "teacher"], ["学籍番号", "student_number"], ["氏名", "name"],
      ["場所", "place"], ["種別", "kind"]]
  },
  {
    key: "attend", label: "レッスンの 出席", all: ["shukketsu"], any: ["sched_all", "meibo"],
    cols: [["日付", "date"], ["学籍番号", "student_number"], ["氏名", "name"],
      ["先生", "teacher"], ["出欠", "attendance"], ["つけた人", "by"], ["つけた時刻", "at"]]
  },
  {
    key: "event", label: "行事", any: ["gyoji"],
    cols: [["日付", "date"], ["行事名", "title"], ["開始", "start"], ["終了", "end"],
      ["場所", "place"], ["対象 学年", "target_grades"], ["対象 学科", "target_courses"]]
  },
  {
    key: "staff", label: "役職と 所属", any: ["post", "master"],
    cols: [["氏名", "name"], ["役職", "post"], ["所属", "division"], ["立場", "role"]]
  }
]);

/** ★その方が 出せる もの（★見られない ものは 出せません）。 */
export function mayExport(perms, set) {
  const s = permSet(perms);
  if (!set) return false;
  if (set.all && !set.all.every((k) => s.has(k))) return false;
  if (set.any && !set.any.some((k) => s.has(k))) return false;
  return true;
}

/** ★出せる ものの 一覧。 */
export function exportSets(perms) {
  return EXPORT_SETS.filter((x) => mayExport(perms, x));
}

/** ★出せない ものの 名（★黙って 隠しません。★名ざしで お伝えします）。 */
export function cannotExport(perms) {
  return EXPORT_SETS.filter((x) => !mayExport(perms, x)).map((x) => x.label);
}

// ---------------------------------------------------------------------------
// ★そもそも 選べない もの（★健康に かかわる もの ほか）
// ---------------------------------------------------------------------------
//   ★★★一覧に 入れません。★`EXPORT_SETS` に 1つも ありません。
//     ★★「選んだ まま 出して しまった」が 起きません。
//   ★★画面には 名ざしで 出します。★見えない ところで 消しません。

export const NEVER_EXPORT = Object.freeze([
  "生徒の 声の記録", "生徒の からだの記録", "生徒の ノート・レパートリー",
  "生徒の 時間割の 中身", "受診用の 1枚", "連絡の 本文", "くらべる・かぞえるの 結果"
]);

/**
 * ★台帳に ある、★出しては いけない 列の 名（★`lib/shareScope.js` と 同じ 並び）。
 *
 *   ★★★はじめ「含んで いたら 駄目」で 見て いました。★誤りでした。
 *     ★★`status`（在籍の 様子）が `stat` に 当たって いました。
 *     ★★★言葉の 一部で 判じません。★名の まま 見比べます。
 */
export const FORBIDDEN_COLUMNS = Object.freeze([
  "throat_condition", "voice_quality", "resonance_score", "voice_checkins",
  "medication_tags", "regular_medications", "allergies", "cycle_start",
  "health_notes", "conditions", "is_under_18", "wake_note", "notes", "repertoire",
  "body", "renraku_body", "my_timetable"
]);

/** ★出せない ものが、★ほんとうに 一覧に 無いか（★見張りが 使います）。 */
export function neverExportIsAbsent() {
  const 鍵 = EXPORT_SETS.flatMap((x) => x.cols.map((c) => String(c[1])));
  return !鍵.some((k) => FORBIDDEN_COLUMNS.includes(k));
}

// ---------------------------------------------------------------------------
// ★形
// ---------------------------------------------------------------------------

export const ENCODINGS = Object.freeze(["UTF-8（BOMつき）", "UTF-8"]);
export const NEWLINES = Object.freeze(["CRLF", "LF"]);
export const DATE_FORMATS = Object.freeze(["2026/09/14", "2026-09-14", "20260914", "令和8年9月14日"]);

/** ★見出しの 対応表（★学校の 様式に 合わせます）。 */
export const HEADER_PRESETS = Object.freeze({
  "そのまま": {},
  "BLEND": { student_number: "生徒コード", name: "生徒氏名", grade: "学年", teacher: "担当教員" },
  "賢者クラウド": { student_number: "生徒ID", name: "氏名", division: "コース名", attendance: "出欠区分" },
  "EDUCOM": { student_number: "児童生徒番号", name: "氏名", grade: "学年", attendance: "出欠" },
  "システムディ": { student_number: "学籍№", name: "学生氏名", division: "学科", teacher: "指導教員" }
});

const 曜 = ["日", "月", "火", "水", "木", "金", "土"];

/** ★日付の 字（★`YYYY-MM-DD` から）。★読めなければ 空。 */
export function formatDate(iso, fmt) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return "";
  const [, y, mo, d] = m;
  if (fmt === "2026-09-14") return `${y}-${mo}-${d}`;
  if (fmt === "20260914") return `${y}${mo}${d}`;
  if (fmt === "令和8年9月14日") {
    // ★★令和は 2019年が 元年 です。★それより 前は 西暦の まま 出します。
    const n = Number(y) - 2018;
    return n >= 1 ? `令和${n}年${Number(mo)}月${Number(d)}日` : `${y}年${Number(mo)}月${Number(d)}日`;
  }
  return `${y}/${mo}/${d}`;
}

/** ★曜日の 字。 */
export function weekdayOf(iso) {
  const d = new Date(`${String(iso || "").slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? "" : 曜[d.getDay()];
}

/** ★1つ の 桝（★引用符は 2つ に します）。 */
function 桝(v) {
  return `"${String(v === null || v === undefined ? "" : v).replace(/"/g, '""')}"`;
}

/**
 * ★CSV を 組み立てます。
 *
 *   ★★`set` … `EXPORT_SETS` の 1つ
 *   ★★`rows` … `rowsFor` が 作った 素（★鍵→値）
 *   ★★`preset` … 見出しの 対応表の 名
 *   ★★BOM は 呼ぶ 側が 付けます（★文字コードの 決め だからです）。
 */
export function buildCsv({ set, rows, preset, newline }) {
  const 表 = HEADER_PRESETS[preset] || {};
  const 頭 = (set.cols || []).map((c) => 表[c[1]] || c[0]);
  const 行 = (rows || []).map((r) => (set.cols || []).map((c) => 桝(r[c[1]])));
  const 改 = newline === "LF" ? "\n" : "\r\n";
  return [頭.map(桝).join(","), ...行.map((r) => r.join(","))].join(改) + 改;
}

/** ★落とす ファイルの 名。 */
export function fileNameOf(set, todayISO) {
  const d = String(todayISO || "").replace(/-/g, "");
  return `woolsong_${(set && set.key) || "data"}_${d}.csv`;
}

// ---------------------------------------------------------------------------
// ★素を 作る（★ここが 唯一の 組み立て。★画面では 作りません）
// ---------------------------------------------------------------------------

/**
 * ★その 1つ ぶんの 行。
 *
 *   ★★`d` に 渡す もの ──
 *     `enrollments` `assignments` `lessons` `events` `members` `divisions`
 *     `nameOf(id)` `kanaOf(id)` `placeNameOf(id)` `postNameOf(memberRow)`
 *     `dateFmt`（★日付の 形）
 *
 *   ★★★無い ものは 空に します。★作りません。
 */
export function rowsFor(setKey, d) {
  const 名 = (id) => (d.nameOf ? d.nameOf(id) || "" : "");
  const 日 = (iso) => formatDate(String(iso || "").slice(0, 10), d.dateFmt);
  const 所属 = (id) => {
    const x = (d.divisions || []).find((v) => String(v.id) === String(id));
    return x ? x.name || "" : "";
  };
  const 上の所属 = (id) => {
    const x = (d.divisions || []).find((v) => String(v.id) === String(id));
    return x && x.parent_id ? 所属(x.parent_id) : "";
  };
  const 先生たち = (sid) => (d.assignments || [])
    .filter((a) => a && !a.ended_at && String(a.student_id) === String(sid))
    .map((a) => 名(a.teacher_id)).filter(Boolean).join("；");
  const 学籍 = (sid) => {
    const e = (d.enrollments || []).find((x) => String(x.student_id) === String(sid));
    return (e && e.student_number) || "";
  };
  const 時 = (iso) => {
    const dt = new Date(iso);
    return Number.isNaN(dt.getTime()) ? ""
      : `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  };
  const 終 = (iso, min) => {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "";
    dt.setMinutes(dt.getMinutes() + (Number(min) || 0));
    return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  };
  const 日付だけ = (iso) => {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "";
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-`
      + `${String(dt.getDate()).padStart(2, "0")}`;
  };

  if (setKey === "meibo") {
    return (d.enrollments || []).map((e) => ({
      student_number: e.student_number || "",
      name: 名(e.student_id),
      kana: d.kanaOf ? d.kanaOf(e.student_id) || "" : "",
      division: 所属(e.division_id),
      division_parent: 上の所属(e.division_id),
      grade: e.grade_label || "",
      teacher: 先生たち(e.student_id),
      status: e.status === "active" ? "在籍" : e.status || "",
      since: e.enrolled_at ? 日(日付だけ(e.enrolled_at)).slice(0, 7) : ""
    }));
  }
  if (setKey === "lesson") {
    return (d.lessons || []).map((l) => ({
      date: 日(日付だけ(l.scheduled_at)),
      dow: weekdayOf(日付だけ(l.scheduled_at)),
      start: 時(l.scheduled_at),
      end: 終(l.scheduled_at, l.duration_minutes),
      teacher: 名(l.teacher_id),
      student_number: 学籍(l.student_id),
      name: 名(l.student_id),
      place: d.placeNameOf ? d.placeNameOf(l.place_id) || "" : "",
      kind: l.kind || ""
    }));
  }
  if (setKey === "attend") {
    return (d.lessons || []).filter((l) => l && l.attendance).map((l) => ({
      date: 日(日付だけ(l.scheduled_at)),
      student_number: 学籍(l.student_id),
      name: 名(l.student_id),
      teacher: 名(l.teacher_id),
      attendance: ATTEND_WORD[l.attendance] || l.attendance || "",
      by: 名(l.attendance_by),
      at: 時(l.attendance_at)
    }));
  }
  if (setKey === "event") {
    return (d.events || []).filter((e) => e && !e.withdrawn_at).map((e) => ({
      date: 日(e.event_date),
      title: e.title || "",
      start: (e.start_time || "").slice(0, 5),
      end: (e.end_time || "").slice(0, 5),
      place: e.place || "",
      target_grades: Array.isArray(e.target_grades) ? e.target_grades.join("；") : "",
      target_courses: Array.isArray(e.target_courses) ? e.target_courses.join("；") : ""
    }));
  }
  if (setKey === "staff") {
    return (d.members || []).map((m) => ({
      name: 名(m.user_id),
      post: d.postNameOf ? d.postNameOf(m) || "" : "",
      division: 所属(m.division_id),
      role: ROLE_WORD[m.role] || m.role || ""
    }));
  }
  return [];
}

/** ★出欠の 字（★台帳の 値を、★そのまま 出しません）。 */
export const ATTEND_WORD = Object.freeze({
  came: "出席", absent: "欠席", canceled: "休講"
});
/** ★立場の 字。 */
export const ROLE_WORD = Object.freeze({
  owner: "学校の 主", admin: "事務", teacher: "先生", staff: "職員"
});

// ---------------------------------------------------------------------------
// ★字（★見本の とおり）
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ★名簿に「書き出す」の 口を **置きません**（★裁定 その82 ／ その142・2026-09-21）
// ---------------------------------------------------------------------------
//   ★★見本の 名簿に「@で 書き出す」の 札が あります。★実機には 置きません。
//   ★★★口は 設定 → 書き出す の 1つ だけ です。★それで 足ります。
//     ★★名簿からも 出せる ように すると、★口が 2つに なります。
//     ★★★出す たび に 記録が 残る 決まり（★この 紙の `EXPORT_ASK_NOTE`）は、
//       ★★口が 増える ほど 守りにくく なります。
//   ★★★足したく なったら、★まず 裁定 その82 を 読み直して ください。

export const EXPORT_HEAD = "書き出す（校務システムへ）";
export const EXPORT_WARN = [
  "いまの 校務システムには、つなぐ 口（API）が ほとんど ありません。",
  "だから 取り込める 形の ファイルを 出すのが、一番 確実です。",
  "健康に関するものは、書き出しの 選択肢に ありません。"
];
export const PICK_HEAD = "何を";
export const PICK_SUB = "いくつでも 選べます。";
export const PICK_NONE = "何を 出すか 選んでください。";
export const CANNOT_HEAD = "あなたの 役職では 出せないもの";
export const CANNOT_SUB = "（見られないものは 出せません）";
export const DO_LABEL = "書き出す";
export const DETAIL_OPEN = "細かく 決める ▼";
export const DETAIL_CLOSE = "細かい ところを 畳む ▲";
export const NEVER_HEAD = "書き出せないもの";
export const NEVER_TAIL = "選べません";
export const EXPORT_NOTES = Object.freeze([
  { text: "健康に関するものは、そもそも 選択肢に ありません。切り忘れが 起きません。",
    bold: "健康に関するものは、そもそも 選択肢に ありません。" },
  { text: "誰が・いつ・何を 書き出したかが 残ります。", bold: "誰が・いつ・何を 書き出したかが 残ります。" },
  { text: "2つ以上 選ぶと、1つずつ 落ちます。", bold: "" }
]);

/** ★出す 前の 確かめ（★外へ 出す 行い だからです）。 */
export function exportAsk(labels, rows) {
  return `${(labels || []).join("・")}　${rows}行 を 書き出します。`;
}
export const EXPORT_ASK_NOTE = "誰が・いつ・何を 出したかが 残ります。";

// ---------------------------------------------------------------------------
// ★見本に ある のに、★置いて いない もの
// ---------------------------------------------------------------------------
//   ★★引き金 ── ★下の それぞれに 書いた 日。
//     ★★台帳 docs/ledgers/08-保留している決め.md 08-29

export const EXPORT_NOT_YET = Object.freeze([
  {
    key: "shift_jis",
    line: "文字コード　Shift_JIS",
    why: "画面の 仕組みは UTF-8 しか 書けません。変換の 表を 持って いません",
    needs: "Shift_JIS に 変える 道（表を 積むか、台帳の 側で 作るか）の お決め"
  },
  {
    key: "xlsx",
    line: "形　Excel（.xlsx）",
    why: "xlsx を 組み立てる 道具を 入れて いません",
    needs: "道具を 1つ 増やす、という お決め"
  },
  {
    key: "ics",
    line: "形　iCalendar（.ics）",
    why: "1件ずつ 変わらない 番号（UID）を しまう ところが ありません。"
      + "番号が 変わると、相手の カレンダーに 二重に 入ります",
    needs: "UID を しまう 列、という お決め"
  },
  {
    key: "yoku",
    line: "よく 使う 組み合わせ を 保存する",
    why: "組み合わせを しまう 表が ありません",
    needs: "その 表、という お決め"
  }
]);
