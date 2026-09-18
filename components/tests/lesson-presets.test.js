// ============================================================================
// ★授業の 型 ── ★台帳と 決まり（★裁定 その90 M1・2026-09-18）
//
//   ★★この 見張りは、★書いた SQL の 字を 見ます。
//     ★★台帳の ふるまいは `tools/ask_ledger.py` で 確かめ、★数を 覚え書きに 残します。
//
//   ★★★見る の は 5つ。
//     ★【一】★2つの 表が ある
//     ★【二】★決まりが 裁定の とおり（★見るのは 2つ、★書くのは 事務 だけ）
//     ★【三】★この 蔵の 決まりに 合って いる（★force ／ authenticated ／ 両方 ／ true を 書かない）
//     ★【四】★型を 消しても 出席は 消えない（★`lessons` を 指して いない）
//     ★【五】★取り上げが 先、★渡しが あと
// ============================================================================

const { readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

const sql = readRaw("supabase", "migration_lesson_presets.sql");
// ★★注を 外して から 数えます（★この 蔵で 何度も 踏んだ 罠）。
const 素 = sql.replace(/^\s*--.*$/gm, "");

// ---------------------------------------------------------------------------
// 【一】★2つの 表
// ---------------------------------------------------------------------------
console.log("【一】2つの 表");
t(/create table if not exists public\.lesson_presets/.test(素), "型の 表");
t(/create table if not exists public\.lesson_preset_targets/.test(素), "当てる 先の 表");
t(/org_id uuid not null/.test(素), "★`org_id` を 必ず 持つ");
t((素.match(/org_id uuid not null/g) || []).length === 2, "★2つ とも 持つ");
t(/total_count int not null check \(total_count > 0/.test(素), "★回数は 0 より 大きい");
t(/total_count <= 400/.test(素), "★上限も 置いて いる（★打ち間違い を 残さない）");
t(/primary key \(preset_id, teacher_id\)/.test(素), "1つの 型に 1人 1回");
t(/create unique index if not exists lesson_presets_org_name_idx/.test(素),
  "★同じ 学校で 同じ 名前を 2つ 作らせない");

// ---------------------------------------------------------------------------
// 【二】★決まり
// ---------------------------------------------------------------------------
console.log("【二】決まり（★裁定 その90 §5-3）");
t(/for select to authenticated\s*\n\s*using \(has_can\(org_id, 'meibo'\) or has_can\(org_id, 'monka_write'\)\)/.test(素),
  "★見るのは 事務 と 先生");
t((素.match(/using \(has_can\(org_id, 'meibo'\)\)\s*\n\s*with check \(has_can\(org_id, 'meibo'\)\)/g) || []).length === 2,
  "★書くのは 事務 だけ（★2つ とも）");
// ★★★`using (true)` を 書かない。
t(!/using \(true\)/i.test(素), "★`using (true)` を 書いて いない");
t(/using \(true\)/i.test("using (true)"), "★わざとの 1件を 見つけられる");

// ---------------------------------------------------------------------------
// 【三】★この 蔵の 決まり
// ---------------------------------------------------------------------------
console.log("【三】この 蔵の 決まり");
t((素.match(/enable row level security/g) || []).length === 2, "2つ とも 決まりを 効かせる");
t((素.match(/force row level security/g) || []).length === 2, "★2つ とも `force`（★作り主も 通す）");
t((素.match(/to authenticated/g) || []).length >= 4, "★どの 決まりも `authenticated`");
t(!/to public\b/.test(素), "★`public` に 開けて いない");
t(!/\bBEGIN\b/i.test(素) && !/\bROLLBACK\b/i.test(素), "★`BEGIN`／`ROLLBACK` を 使って いない");
t((素.match(/drop policy if exists/g) || []).length === 4, "★何度 走らせても 同じ");

// ---------------------------------------------------------------------------
// 【四】★型を 消しても 出席は 消えない（★裁定 その90 Q5）
// ---------------------------------------------------------------------------
console.log("【四】型を 消しても 出席は 消えない");
t(!/references public\.lessons/.test(素), "★`lessons` を 1つも 指して いない");
t(/references public\.lesson_presets\(id\) on delete cascade/.test(素),
  "★当てて いる 結びつき だけ が 一緒に 消える");
// ★★道具の 較正。
t(/references public\.lessons/.test("teacher_id uuid references public.lessons(id)"),
  "★わざとの 1件を 見つけられる");

// ---------------------------------------------------------------------------
// 【五】★取り上げが 先、★渡しが あと
// ---------------------------------------------------------------------------
console.log("【五】取り上げが 先、★渡しが あと");
const r = 素.indexOf("revoke all on table public.lesson_presets");
const g = 素.indexOf("grant select, insert, update, delete on table public.lesson_presets");
t(r > 0 && g > r, "★取り上げ → 渡し の 順");
// ★★★`authenticated` からも 取り上げて いる こと（★2026-09-18 の 見つけもの）。
//   ★★はじめ `public` と `anon` だけ に して いました。
//   ★★台帳の 既定で、★`authenticated` に TRUNCATE まで 渡って いました。
//   ★★★TRUNCATE は 決まりを 通りません。★表を まるごと 空に できます。
t(/revoke all on table public\.lesson_presets from authenticated/.test(素),
  "★`authenticated` からも 取り上げて いる");
t(/revoke all on table public\.lesson_preset_targets from authenticated/.test(素),
  "★2つ とも");

console.log(`\n○ ${ok}　✗ ${ng}`);
process.exit(ng === 0 ? 0 : 1);
