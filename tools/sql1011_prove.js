#!/usr/bin/env node
// ★sql/10（レッスン割）・sql/11（ポートフォリオ／ホームページ）の 確かめ
//   ★試しの 台帳だけ。★なりすまし（set role／ROLLBACK）は 使いません。
//
//   ①自分の 希望を 書ける（★較正・通る 側）
//   ②よその 人の 希望は 書けない
//   ③締切の 過ぎた 回には 書けない
//   ④`pref_map` は **数だけ** 返す（★名前の 列が 無い）
//   ⑤カレンダーの 住所を 作り直せる（★前と ちがう ものに なる）
//   ⑥`set_web_type` …… 4つの 枝を ぜんぶ 通します
//     ⑥-1 持って いる 形へ …… `ok_owned`（★いつでも ただ）
//     ⑥-2 14日の あいだ ……… `ok_trial`
//     ⑥-3 分野ごとに 1つ …… `ok_field_free`
//     ⑥-4 それ以外 ………… `need_payment`
//   ⑦紙の 型は いつでも 変えられる
//   ⑧公開して いない slug への 問い合わせ → false（★理由を 返さない）
//   ⑨公開して いる slug → true・1行 増える
//   ⑩よその 人の 問い合わせは 見えない（0行）
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));

const ORG = "11111111-1111-4111-8111-111111111111";
const 開いた回 = "44444444-4444-4444-8444-444444444441";
const 締切ずみ = "44444444-4444-4444-8444-444444444442";
const YOSO = "6fdc5121-adab-4962-a202-6d7c340ea994";

function env(p) {
  const o = {};
  fs.readFileSync(path.join(ROOT, p), "utf8").split("\n").forEach((l) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });
  return o;
}
const 台 = (sql, write) => execFileSync("python3",
  [path.join(ROOT, "tools/ask_ledger.py"), "--test", ...(write ? ["--write", "--ok"] : []), sql],
  { encoding: "utf8" });
const 数える = (sql) => { const m = /^\s*(\d+)\s*$/m.exec(台(sql)); return m ? Number(m[1]) : NaN; };

let 数 = 0, 落 = 0;
const みる = (名, ok, 註) => { 数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${名}${註 ? "  -- " + 註 : ""}`); };

(async () => {
  const 台帳 = env(".env.local"), e2e = env(".env.e2e");
  const sb = createClient(台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const anon = createClient(台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const { error: e0 } = await sb.auth.signInWithPassword({
    email: e2e.E2E_LOCAL_EMAIL, password: e2e.E2E_LOCAL_PASSWORD });
  if (e0) { console.error("入れません --", e0.message); process.exit(1); }
  const { data: 私 } = await sb.auth.getUser();
  const 私のid = 私 && 私.user && 私.user.id;
  console.log("★入った 人 ……", e2e.E2E_LOCAL_EMAIL, 私のid);

  // ★走る たびに 前の 跡を 片づけます。
  台(`delete from public.lesson_prefs where round_id in ('${開いた回}','${締切ずみ}')`, true);
  台(`delete from public.page_inquiries where owner_user_id = '${私のid}'`, true);

  console.log("\n=== 一 レッスン割（sql/10）===");
  {
    const { data, error } = await sb.from("lesson_prefs")
      .insert({ round_id: 開いた回, user_id: 私のid, slot_key: "1-aaa", level: 2 })
      .select("slot_key");
    みる("①自分の 希望を 書ける（較正）", !error && data && data.length === 1,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }
  {
    const { data, error } = await sb.from("lesson_prefs")
      .insert({ round_id: 開いた回, user_id: YOSO, slot_key: "2-bbb", level: 2 })
      .select("slot_key");
    みる("②よその 人の 希望は 書けない", !!error || !data || data.length === 0,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }
  {
    const { data, error } = await sb.from("lesson_prefs")
      .insert({ round_id: 締切ずみ, user_id: 私のid, slot_key: "3-ccc", level: 2 })
      .select("slot_key");
    みる("③締切の 過ぎた 回には 書けない", !!error || !data || data.length === 0,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }
  {
    const { data, error } = await sb.rpc("pref_map", { p_round_id: 開いた回 });
    const 列 = data && data.length > 0 ? Object.keys(data[0]) : [];
    みる("④pref_map は 数だけ 返す（★名前の 列が 無い）",
      !error && 列.every((k) => ["slot_key", "maru", "sankaku"].includes(k)),
      error ? String(error.message).slice(0, 46) : 列.join(","));
    みる("④-2 人の id も 名前も 返って いない",
      !JSON.stringify(data || []).includes(私のid));
  }
  {
    const 前 = 台(`select token from public.calendar_tokens where user_id = '${私のid}'`);
    const { data, error } = await sb.rpc("rotate_calendar_token");
    const 後 = 台(`select token from public.calendar_tokens where user_id = '${私のid}'`);
    みる("⑤カレンダーの 住所を 作り直せる", !error && !!data && 前 !== 後,
      error ? String(error.message).slice(0, 46) : "前と ちがう もの に なりました");
  }

  console.log("\n=== 二 ポートフォリオ／ホームページ（sql/11）===");
  {
    // ★★4つの 枝を 1つずつ 作って 通します。
    //   ★★★試しの 行を 直して から 呼びます。★呼ぶ 順で 答えが 変わります。
    // ★★★型の 鍵は `t01`〜`t15`、★紙は `T1`〜`T6`、★分野は music/voice/stage/teacher。
    //   ★★sql/19 が 縛って います（★裁定127・128）。★勝手な 字を 使うと 当てられません。
    //   ★★2026-09-23、★`kata-a` `seigaku` と 書いて いて 落ちました。★台帳に 合わせました。
    const 直す = (sql) => 台(sql, true);
    const 消す = () => 直す(`delete from public.page_types_owned where user_id = '${私のid}'`);

    // ⑥-4 それ以外（★14日でも 無く、★分野も 空）
    消す();
    直す(`update public.portfolios set trial_until = null, field = null, web_type = null
            where user_id = '${私のid}'`);
    const a = await sb.rpc("set_web_type", { p_type_key: "t01" });
    みる("⑥-4 それ以外 → need_payment", !a.error && a.data === "need_payment",
      a.error ? String(a.error.message).slice(0, 46) : String(a.data));

    // ⑥-3 分野ごとに 1つ ただ
    直す(`update public.portfolios set field = 'voice' where user_id = '${私のid}'`);
    const b = await sb.rpc("set_web_type", { p_type_key: "t02" });
    みる("⑥-3 分野ごとに 1つ → ok_field_free", !b.error && b.data === "ok_field_free",
      b.error ? String(b.error.message).slice(0, 46) : String(b.data));

    // ⑥-1 持って いる 形へ 戻る（★いま `kata-b` を 持って います）
    const c = await sb.rpc("set_web_type", { p_type_key: "t02" });
    みる("⑥-1 持って いる 形へ → ok_owned", !c.error && c.data === "ok_owned",
      c.error ? String(c.error.message).slice(0, 46) : String(c.data));

    // ★2つ目の 分野ただは 使えない（★1回 きり）
    const d = await sb.rpc("set_web_type", { p_type_key: "t03" });
    みる("⑥-3-2 分野ただは 1回 きり → need_payment", !d.error && d.data === "need_payment",
      d.error ? String(d.error.message).slice(0, 46) : String(d.data));

    // ⑥-2 14日の あいだ
    消す();
    直す(`update public.portfolios set trial_until = now() + interval '7 days'
            where user_id = '${私のid}'`);
    const e = await sb.rpc("set_web_type", { p_type_key: "t04" });
    みる("⑥-2 14日の あいだ → ok_trial", !e.error && e.data === "ok_trial",
      e.error ? String(e.error.message).slice(0, 46) : String(e.data));

    // ★期限が 過ぎたら もう ただでは ない
    直す(`update public.portfolios set trial_until = now() - interval '1 day'
            where user_id = '${私のid}'`);
    消す();
    直す(`update public.portfolios set field = null where user_id = '${私のid}'`);
    const f = await sb.rpc("set_web_type", { p_type_key: "t05" });
    みる("⑥-2-2 期限が 過ぎたら → need_payment", !f.error && f.data === "need_payment",
      f.error ? String(f.error.message).slice(0, 46) : String(f.data));
    消す();
    直す(`update public.portfolios set trial_until = null, field = null, web_type = null
            where user_id = '${私のid}'`);
  }
  {
    const { data, error } = await sb.from("portfolios")
      // ★★紙の 型の 鍵は `T1`〜`T6` です（★sql/19 の 縛り・裁定127）。
      //   ★★2026-09-23、★`kami-01` と 書いて いて、★sql/19 が 当てられません でした。
      //     ★★私の 試しの 行が 縛りに 当たって いました。★Opus の SQL の 誤りでは ありません。
      .update({ paper_type: "T1" }).eq("user_id", 私のid).select("user_id");
    みる("⑦紙の 型は いつでも 変えられる", !error && data && data.length === 1,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }
  {
    const { data, error } = await anon.rpc("submit_inquiry",
      { p_slug: "himitsu-hanako", p_name: "★ためし", p_email: "a@example.com", p_body: "★ためし" });
    みる("⑧公開して いない slug → false（理由を 返さない）", !error && data === false,
      error ? String(error.message).slice(0, 46) : String(data));
  }
  {
    const 前 = 数える(`select count(*) from public.page_inquiries where owner_user_id = '${私のid}'`);
    const { data, error } = await anon.rpc("submit_inquiry",
      { p_slug: "tameshi-taro", p_name: "★ためし", p_email: "a@example.com", p_body: "★ためし" });
    const 後 = 数える(`select count(*) from public.page_inquiries where owner_user_id = '${私のid}'`);
    みる("⑨公開して いる slug → true・1行 増える（較正）",
      !error && data === true && 後 === 前 + 1,
      error ? String(error.message).slice(0, 46) : `${前} → ${後}`);
  }
  {
    const { data, error } = await anon.from("page_inquiries").select("id");
    みる("⑩入って いない 人には 見えない（0行）",
      !!error || !data || data.length === 0,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }

  console.log(`\n  ${数 - 落} / ${数}`);
  process.exit(落 ? 1 : 0);
})();
